use axum::{
    body::Body,
    extract::State,
    http::{header, Method, StatusCode, Uri},
    response::Response,
    Router,
};
use rand::Rng;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, OnceLock};
use tauri::{AppHandle, Emitter, State as TauriState};
use tokio::sync::{oneshot, Mutex, RwLock};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MockHeaderDto {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MockRouteDto {
    pub id: String,
    pub method: String,
    pub path: String,
    pub status: u16,
    pub delay_ms: u64,
    pub enabled: bool,
    pub description: String,
    pub response_body: String,
    pub response_headers: Vec<MockHeaderDto>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct MockRequestLog {
    method: String,
    path: String,
    matched: bool,
    status: u16,
    duration_ms: u64,
    timestamp: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MockStatusDto {
    pub running: bool,
    pub port: u16,
}

#[derive(Clone)]
struct MockShared {
    routes: Arc<RwLock<Vec<MockRouteDto>>>,
    app: AppHandle,
}

struct MockServerInner {
    running: bool,
    port: u16,
    routes: Arc<RwLock<Vec<MockRouteDto>>>,
    shutdown_tx: Option<oneshot::Sender<()>>,
    stopped_rx: Option<oneshot::Receiver<()>>,
}

pub struct MockServerState {
    inner: Arc<Mutex<MockServerInner>>,
}

impl Default for MockServerState {
    fn default() -> Self {
        Self {
            inner: Arc::new(Mutex::new(MockServerInner {
                running: false,
                port: 8765,
                routes: Arc::new(RwLock::new(Vec::new())),
                shutdown_tx: None,
                stopped_rx: None,
            })),
        }
    }
}

#[tauri::command]
pub async fn mock_start(
    app: AppHandle,
    state: TauriState<'_, MockServerState>,
    port: u16,
    routes: Vec<MockRouteDto>,
) -> Result<(), String> {
    let mut inner = state.inner.lock().await;
    if inner.running {
        return Err("Mock server is already running".into());
    }

    *inner.routes.write().await = routes;
    let shared = MockShared { routes: inner.routes.clone(), app: app.clone() };

    let router = Router::new().fallback(mock_handler).with_state(shared);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .map_err(|e| format!("Failed to bind port {port}: {e}"))?;

    let (shutdown_tx, shutdown_rx) = oneshot::channel::<()>();
    let (stopped_tx, stopped_rx) = oneshot::channel::<()>();

    tokio::spawn(async move {
        let server = axum::serve(listener, router).with_graceful_shutdown(async {
            let _ = shutdown_rx.await;
        });
        if let Err(e) = server.await {
            eprintln!("[mock] server error: {e}");
        }
        // Signals that the TCP listener has actually been dropped and the
        // port is free again — mock_stop awaits this so an immediate
        // mock_start on the same port doesn't race the OS into returning
        // "address already in use".
        let _ = stopped_tx.send(());
    });

    inner.running = true;
    inner.port = port;
    inner.shutdown_tx = Some(shutdown_tx);
    inner.stopped_rx = Some(stopped_rx);
    Ok(())
}

#[tauri::command]
pub async fn mock_stop(state: TauriState<'_, MockServerState>) -> Result<(), String> {
    let mut inner = state.inner.lock().await;
    let Some(tx) = inner.shutdown_tx.take() else {
        inner.running = false;
        return Ok(());
    };
    let _ = tx.send(());
    inner.running = false;

    if let Some(stopped_rx) = inner.stopped_rx.take() {
        // Bounded wait — if something's gone wrong we'd rather return than
        // hang the UI forever, but graceful axum shutdown is normally
        // near-instant once the signal is sent.
        let _ = tokio::time::timeout(std::time::Duration::from_secs(3), stopped_rx).await;
    }
    Ok(())
}

#[tauri::command]
pub async fn mock_update_routes(state: TauriState<'_, MockServerState>, routes: Vec<MockRouteDto>) -> Result<(), String> {
    let inner = state.inner.lock().await;
    *inner.routes.write().await = routes;
    Ok(())
}

#[tauri::command]
pub async fn mock_status(state: TauriState<'_, MockServerState>) -> Result<MockStatusDto, String> {
    let inner = state.inner.lock().await;
    Ok(MockStatusDto { running: inner.running, port: inner.port })
}

async fn mock_handler(State(shared): State<MockShared>, method: Method, uri: Uri) -> Response {
    let start = std::time::Instant::now();
    let path = uri.path().to_string();
    let method_str = method.as_str().to_uppercase();

    let routes = shared.routes.read().await.clone();
    let matched = routes
        .into_iter()
        .find(|r| r.enabled && r.method.eq_ignore_ascii_case(&method_str) && path_matches(&r.path, &path));

    let response = match &matched {
        Some(route) => {
            if route.delay_ms > 0 {
                tokio::time::sleep(std::time::Duration::from_millis(route.delay_ms)).await;
            }
            let body = render_template(&route.response_body);
            let status = StatusCode::from_u16(route.status).unwrap_or(StatusCode::OK);
            let mut builder = Response::builder().status(status);
            let mut has_content_type = false;
            for h in &route.response_headers {
                if h.key.eq_ignore_ascii_case("content-type") {
                    has_content_type = true;
                }
                builder = builder.header(h.key.as_str(), h.value.as_str());
            }
            if !has_content_type {
                builder = builder.header(header::CONTENT_TYPE, "application/json");
            }
            builder
                .body(Body::from(body))
                .unwrap_or_else(|_| Response::builder().status(StatusCode::INTERNAL_SERVER_ERROR).body(Body::empty()).unwrap())
        }
        None => Response::builder()
            .status(StatusCode::NOT_FOUND)
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(r#"{"error":"No mock route matched this method/path"}"#))
            .unwrap(),
    };

    let log = MockRequestLog {
        method: method_str,
        path,
        matched: matched.is_some(),
        status: matched.map(|r| r.status).unwrap_or(404),
        duration_ms: start.elapsed().as_millis() as u64,
        timestamp: chrono::Utc::now().to_rfc3339(),
    };
    let _ = shared.app.emit("mock-request", &log);

    response
}

/// Supports exact segments and `:param` wildcards, e.g. `/users/:id`.
fn path_matches(pattern: &str, actual: &str) -> bool {
    if pattern == "/" || pattern.is_empty() {
        return actual == "/" || actual.is_empty();
    }
    let pat_segs: Vec<&str> = pattern.trim_matches('/').split('/').filter(|s| !s.is_empty()).collect();
    let act_segs: Vec<&str> = actual.trim_matches('/').split('/').filter(|s| !s.is_empty()).collect();
    if pat_segs.len() != act_segs.len() {
        return false;
    }
    pat_segs.iter().zip(act_segs.iter()).all(|(p, a)| p.starts_with(':') || p == a)
}

fn template_regex() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| Regex::new(r"\{\{\$(\w+)(?:\(([^)]*)\))?\}\}").unwrap())
}

/// Renders `{{$uuid}}`, `{{$timestamp}}`, `{{$isoTimestamp}}`,
/// `{{$randomInt}}` / `{{$randomInt(min,max)}}`, `{{$randomFloat}}`,
/// `{{$randomBool}}`, `{{$randomString}}`, `{{$randomEmail}}`.
fn render_template(input: &str) -> String {
    template_regex()
        .replace_all(input, |caps: &regex::Captures| {
            let name = &caps[1];
            let args = caps.get(2).map(|m| m.as_str()).unwrap_or("");
            match name {
                "uuid" => uuid::Uuid::new_v4().to_string(),
                "timestamp" => chrono::Utc::now().timestamp().to_string(),
                "isoTimestamp" => chrono::Utc::now().to_rfc3339(),
                "randomInt" => {
                    let (min, max) = parse_range_i(args, 0, 1000);
                    random_range_i(min, max).to_string()
                }
                "randomFloat" => {
                    let (min, max) = parse_range_f(args, 0.0, 1.0);
                    format!("{:.4}", random_range_f(min, max))
                }
                "randomBool" => (random_range_i(0, 1) == 1).to_string(),
                "randomString" => random_string(10),
                "randomEmail" => format!("{}@example.com", random_string(8).to_lowercase()),
                _ => caps[0].to_string(),
            }
        })
        .to_string()
}

fn parse_range_i(args: &str, default_min: i64, default_max: i64) -> (i64, i64) {
    let parts: Vec<&str> = args.split(',').map(|s| s.trim()).collect();
    if parts.len() == 2 {
        (parts[0].parse().unwrap_or(default_min), parts[1].parse().unwrap_or(default_max))
    } else {
        (default_min, default_max)
    }
}

fn parse_range_f(args: &str, default_min: f64, default_max: f64) -> (f64, f64) {
    let parts: Vec<&str> = args.split(',').map(|s| s.trim()).collect();
    if parts.len() == 2 {
        (parts[0].parse().unwrap_or(default_min), parts[1].parse().unwrap_or(default_max))
    } else {
        (default_min, default_max)
    }
}

fn random_range_i(min: i64, max: i64) -> i64 {
    if min >= max {
        return min;
    }
    rand::thread_rng().gen_range(min..=max)
}

fn random_range_f(min: f64, max: f64) -> f64 {
    if min >= max {
        return min;
    }
    rand::thread_rng().gen_range(min..max)
}

fn random_string(len: usize) -> String {
    const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let mut rng = rand::thread_rng();
    (0..len).map(|_| CHARS[rng.gen_range(0..CHARS.len())] as char).collect()
}