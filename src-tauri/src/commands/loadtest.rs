use futures_util::future::join_all;
use reqwest::redirect::Policy;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex as AsyncMutex;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadTestConfig {
    pub test_id: String,
    pub shape: String, // "load" | "stress" | "spike" | "soak"
    pub method: String,
    pub url: String,
    #[serde(default)]
    pub headers: Vec<(String, String)>,
    #[serde(default)]
    pub body: Option<String>,

    pub virtual_users: Option<u32>,
    pub duration_secs: Option<u64>,
    pub requests_per_vu: Option<u32>,

    pub start_vus: Option<u32>,
    pub peak_vus: Option<u32>,
    pub ramp_duration_secs: Option<u64>,
    pub hold_at_peak_secs: Option<u64>,

    pub base_vus: Option<u32>,
    pub spike_vus: Option<u32>,
    pub pre_spike_secs: Option<u64>,
    pub spike_secs: Option<u64>,
    pub post_spike_secs: Option<u64>,

    #[serde(default)]
    pub ramp_up_secs: u64,
    #[serde(default)]
    pub think_time_ms: u64,
    #[serde(default = "default_timeout")]
    pub timeout_secs: u64,
    #[serde(default = "default_true")]
    pub follow_redirects: bool,
}
fn default_timeout() -> u64 {
    30
}
fn default_true() -> bool {
    true
}

#[derive(Default)]
struct Stats {
    total: AtomicU64,
    success: AtomicU64,
    redirect: AtomicU64,
    client_error: AtomicU64,
    server_error: AtomicU64,
    network_error: AtomicU64,
    latencies: AsyncMutex<Vec<u64>>,
}

const MAX_STORED_LATENCIES: usize = 50_000;

struct RunHandle {
    cancelled: Arc<AtomicBool>,
}

#[derive(Default)]
pub struct LoadTestManager {
    runs: Arc<AsyncMutex<HashMap<String, RunHandle>>>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct ProgressEvent {
    test_id: String,
    elapsed_ms: u64,
    active_vus: u32,
    total_requests: u64,
    success: u64,
    redirect: u64,
    client_error: u64,
    server_error: u64,
    network_error: u64,
    rps: f64,
    latency_avg_ms: f64,
    latency_min_ms: u64,
    latency_max_ms: u64,
    p50_ms: u64,
    p90_ms: u64,
    p95_ms: u64,
    p99_ms: u64,
    done: bool,
}

fn percentile(sorted: &[u64], p: f64) -> u64 {
    if sorted.is_empty() {
        return 0;
    }
    let idx = ((sorted.len() as f64 - 1.0) * p).round() as usize;
    sorted[idx.min(sorted.len() - 1)]
}

async fn snapshot(
    test_id: &str,
    stats: &Stats,
    active_vus: u32,
    elapsed: Duration,
    last_total: u64,
    last_tick: Instant,
    done: bool,
) -> ProgressEvent {
    let total = stats.total.load(Ordering::Relaxed);
    let mut sorted = { stats.latencies.lock().await.clone() };
    sorted.sort_unstable();

    let avg = if sorted.is_empty() { 0.0 } else { sorted.iter().sum::<u64>() as f64 / sorted.len() as f64 };
    let delta_secs = last_tick.elapsed().as_secs_f64().max(0.001);
    let rps = (total.saturating_sub(last_total)) as f64 / delta_secs;

    ProgressEvent {
        test_id: test_id.to_string(),
        elapsed_ms: elapsed.as_millis() as u64,
        active_vus,
        total_requests: total,
        success: stats.success.load(Ordering::Relaxed),
        redirect: stats.redirect.load(Ordering::Relaxed),
        client_error: stats.client_error.load(Ordering::Relaxed),
        server_error: stats.server_error.load(Ordering::Relaxed),
        network_error: stats.network_error.load(Ordering::Relaxed),
        rps,
        latency_avg_ms: avg,
        latency_min_ms: sorted.first().copied().unwrap_or(0),
        latency_max_ms: sorted.last().copied().unwrap_or(0),
        p50_ms: percentile(&sorted, 0.50),
        p90_ms: percentile(&sorted, 0.90),
        p95_ms: percentile(&sorted, 0.95),
        p99_ms: percentile(&sorted, 0.99),
        done,
    }
}

/// (max concurrent VUs ever needed, total test duration secs, timeline of
/// (elapsed_secs, target_vus) breakpoints — linearly interpolated between
/// consecutive points to produce ramps).
fn build_timeline(cfg: &LoadTestConfig) -> (u32, u64, Vec<(f64, u32)>) {
    match cfg.shape.as_str() {
        "stress" => {
            let start = cfg.start_vus.unwrap_or(1);
            let peak = cfg.peak_vus.unwrap_or(50);
            let ramp = cfg.ramp_duration_secs.unwrap_or(30) as f64;
            let hold = cfg.hold_at_peak_secs.unwrap_or(10) as f64;
            (peak.max(start), (ramp + hold).ceil() as u64, vec![(0.0, start), (ramp, peak), (ramp + hold, peak)])
        }
        "spike" => {
            let base = cfg.base_vus.unwrap_or(5);
            let spike = cfg.spike_vus.unwrap_or(50);
            let pre = cfg.pre_spike_secs.unwrap_or(10) as f64;
            let dur = cfg.spike_secs.unwrap_or(5) as f64;
            let post = cfg.post_spike_secs.unwrap_or(15) as f64;
            (
                base.max(spike),
                (pre + dur + post).ceil() as u64,
                vec![(0.0, base), (pre, spike), (pre + dur, spike), (pre + dur + 0.001, base), (pre + dur + post, base)],
            )
        }
        "soak" => {
            let vus = cfg.virtual_users.unwrap_or(5);
            let dur = cfg.duration_secs.unwrap_or(300) as f64;
            let ramp = (cfg.ramp_up_secs as f64).max(0.001);
            (vus, dur as u64, vec![(0.0, 0), (ramp, vus), (dur, vus)])
        }
        _ => {
            let vus = cfg.virtual_users.unwrap_or(10);
            let dur = cfg.duration_secs.unwrap_or(30) as f64;
            let ramp = (cfg.ramp_up_secs as f64).max(0.001);
            (vus, dur as u64, vec![(0.0, 0), (ramp, vus), (dur, vus)])
        }
    }
}

fn target_vus_at(timeline: &[(f64, u32)], t: f64) -> u32 {
    if timeline.is_empty() {
        return 0;
    }
    if t <= timeline[0].0 {
        return timeline[0].1;
    }
    for w in timeline.windows(2) {
        let (t0, v0) = w[0];
        let (t1, v1) = w[1];
        if t >= t0 && t <= t1 {
            if t1 <= t0 {
                return v1;
            }
            let ratio = (t - t0) / (t1 - t0);
            return (v0 as f64 + (v1 as f64 - v0 as f64) * ratio).round() as u32;
        }
    }
    timeline.last().unwrap().1
}

#[tauri::command]
pub async fn run_load_test(app: AppHandle, manager: State<'_, LoadTestManager>, config: LoadTestConfig) -> Result<(), String> {
    let cancelled = Arc::new(AtomicBool::new(false));
    manager.runs.lock().await.insert(config.test_id.clone(), RunHandle { cancelled: cancelled.clone() });

    let (max_vus, total_secs, timeline) = build_timeline(&config);
    let target_vus = Arc::new(AtomicU32::new(0));
    let stats = Arc::new(Stats::default());

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(config.timeout_secs.max(1)))
        .redirect(if config.follow_redirects { Policy::limited(10) } else { Policy::none() })
        .build()
        .map_err(|e| e.to_string())?;

    let method = reqwest::Method::from_bytes(config.method.as_bytes()).unwrap_or(reqwest::Method::GET);
    let url = config.url.clone();
    let headers = config.headers.clone();
    let body = config.body.clone();
    let think_time_ms = config.think_time_ms;
    let requests_per_vu = config.requests_per_vu.unwrap_or(0);
    let start = Instant::now();

    {
        let target_vus = target_vus.clone();
        let timeline = timeline.clone();
        let cancelled = cancelled.clone();
        tokio::spawn(async move {
            loop {
                if cancelled.load(Ordering::Relaxed) {
                    break;
                }
                let t = start.elapsed().as_secs_f64();
                if t > total_secs as f64 {
                    break;
                }
                target_vus.store(target_vus_at(&timeline, t), Ordering::Relaxed);
                tokio::time::sleep(Duration::from_millis(200)).await;
            }
            target_vus.store(0, Ordering::Relaxed);
        });
    }

    {
        let app = app.clone();
        let stats = stats.clone();
        let target_vus = target_vus.clone();
        let cancelled = cancelled.clone();
        let test_id = config.test_id.clone();
        tokio::spawn(async move {
            let mut last_total = 0u64;
            let mut last_tick = Instant::now();
            loop {
                if cancelled.load(Ordering::Relaxed) {
                    break;
                }
                let elapsed = start.elapsed();
                if elapsed.as_secs() > total_secs {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(500)).await;
                let ev = snapshot(&test_id, &stats, target_vus.load(Ordering::Relaxed), elapsed, last_total, last_tick, false).await;
                last_total = ev.total_requests;
                last_tick = Instant::now();
                let _ = app.emit("loadtest-progress", ev);
            }
        });
    }

    let mut handles = Vec::new();
    for worker_idx in 0..max_vus {
        let client = client.clone();
        let method = method.clone();
        let url = url.clone();
        let headers = headers.clone();
        let body = body.clone();
        let stats = stats.clone();
        let target_vus = target_vus.clone();
        let cancelled = cancelled.clone();

        handles.push(tokio::spawn(async move {
            let mut my_requests = 0u32;
            loop {
                if cancelled.load(Ordering::Relaxed) {
                    break;
                }
                if start.elapsed().as_secs() > total_secs {
                    break;
                }
                if requests_per_vu > 0 && my_requests >= requests_per_vu {
                    break;
                }
                if worker_idx >= target_vus.load(Ordering::Relaxed) {
                    tokio::time::sleep(Duration::from_millis(100)).await;
                    continue;
                }

                let mut req = client.request(method.clone(), &url);
                for (k, v) in &headers {
                    req = req.header(k, v);
                }
                if let Some(b) = &body {
                    req = req.body(b.clone());
                }

                let t0 = Instant::now();
                let result = req.send().await;
                let latency_ms = t0.elapsed().as_millis() as u64;
                stats.total.fetch_add(1, Ordering::Relaxed);
                my_requests += 1;

                match result {
                    Ok(resp) => match resp.status().as_u16() {
                        200..=299 => { stats.success.fetch_add(1, Ordering::Relaxed); }
                        300..=399 => { stats.redirect.fetch_add(1, Ordering::Relaxed); }
                        400..=499 => { stats.client_error.fetch_add(1, Ordering::Relaxed); }
                        _ => { stats.server_error.fetch_add(1, Ordering::Relaxed); }
                    },
                    Err(_) => { stats.network_error.fetch_add(1, Ordering::Relaxed); }
                }

                {
                    let mut latencies = stats.latencies.lock().await;
                    if latencies.len() < MAX_STORED_LATENCIES {
                        latencies.push(latency_ms);
                    }
                }

                if think_time_ms > 0 {
                    tokio::time::sleep(Duration::from_millis(think_time_ms)).await;
                }
            }
        }));
    }

    join_all(handles).await;

    let final_event = snapshot(&config.test_id, &stats, 0, start.elapsed(), 0, Instant::now(), true).await;
    let _ = app.emit("loadtest-progress", final_event);
    manager.runs.lock().await.remove(&config.test_id);
    Ok(())
}

#[tauri::command]
pub async fn stop_load_test(manager: State<'_, LoadTestManager>, test_id: String) -> Result<(), String> {
    let runs = manager.runs.lock().await;
    if let Some(handle) = runs.get(&test_id) {
        handle.cancelled.store(true, Ordering::Relaxed);
    }
    Ok(())
}