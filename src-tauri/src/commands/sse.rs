use futures_util::StreamExt;
use reqwest::Client;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::Mutex;

#[derive(Clone)]
struct SseHandle {
    cancelled: Arc<AtomicBool>,
    paused: Arc<AtomicBool>,
}

#[derive(Default)]
pub struct SseManager {
    connections: Arc<Mutex<HashMap<String, SseHandle>>>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SseStatusEvent {
    connection_id: String,
    status: &'static str,
    message: Option<String>,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct SseEventPayload {
    connection_id: String,
    event_type: String,
    data: String,
    id: Option<String>,
    timestamp: String,
}

#[tauri::command]
pub async fn sse_connect(
    app: AppHandle,
    manager: State<'_, SseManager>,
    connection_id: String,
    url: String,
    headers: Vec<(String, String)>,
) -> Result<(), String> {
    if let Some(existing) = manager.connections.lock().await.remove(&connection_id) {
        existing.cancelled.store(true, Ordering::Relaxed);
    }

    let _ = app.emit("sse-status", SseStatusEvent { connection_id: connection_id.clone(), status: "connecting", message: None });

    let client = Client::new();
    let mut req = client.get(&url).header("Accept", "text/event-stream").header("Cache-Control", "no-cache");
    for (k, v) in &headers {
        req = req.header(k, v);
    }

    let response = match req.send().await {
        Ok(r) => r,
        Err(e) => {
            let _ = app.emit("sse-status", SseStatusEvent { connection_id: connection_id.clone(), status: "error", message: Some(e.to_string()) });
            return Err(e.to_string());
        }
    };

    if !response.status().is_success() {
        let msg = format!("Server responded with {}", response.status());
        let _ = app.emit("sse-status", SseStatusEvent { connection_id: connection_id.clone(), status: "error", message: Some(msg.clone()) });
        return Err(msg);
    }

    let handle = SseHandle { cancelled: Arc::new(AtomicBool::new(false)), paused: Arc::new(AtomicBool::new(false)) };
    manager.connections.lock().await.insert(connection_id.clone(), handle.clone());

    let _ = app.emit("sse-status", SseStatusEvent { connection_id: connection_id.clone(), status: "open", message: None });

    let task_app = app.clone();
    let task_id = connection_id.clone();
    let task_manager = manager.connections.clone();

    tokio::spawn(async move {
        let mut stream = response.bytes_stream();
        let mut buffer = String::new();
        let mut cur_event: Option<String> = None;
        let mut cur_data = String::new();
        let mut cur_id: Option<String> = None;

        loop {
            if handle.cancelled.load(Ordering::Relaxed) {
                break;
            }
            if handle.paused.load(Ordering::Relaxed) {
                tokio::time::sleep(Duration::from_millis(150)).await;
                continue;
            }

            match tokio::time::timeout(Duration::from_millis(500), stream.next()).await {
                Ok(Some(Ok(bytes))) => {
                    buffer.push_str(&String::from_utf8_lossy(&bytes));
                    while let Some(pos) = buffer.find('\n') {
                        let line = buffer[..pos].trim_end_matches('\r').to_string();
                        buffer.drain(..=pos);

                        if line.is_empty() {
                            if cur_data.is_empty() && cur_event.is_none() {
                                continue;
                            }
                            let payload = SseEventPayload {
                                connection_id: task_id.clone(),
                                event_type: cur_event.clone().unwrap_or_else(|| "message".to_string()),
                                data: cur_data.strip_suffix('\n').unwrap_or(&cur_data).to_string(),
                                id: cur_id.clone(),
                                timestamp: chrono::Utc::now().to_rfc3339(),
                            };
                            let _ = task_app.emit("sse-event", payload);
                            cur_event = None;
                            cur_data.clear();
                        } else if let Some(rest) = line.strip_prefix("data:") {
                            cur_data.push_str(rest.strip_prefix(' ').unwrap_or(rest));
                            cur_data.push('\n');
                        } else if let Some(rest) = line.strip_prefix("event:") {
                            cur_event = Some(rest.strip_prefix(' ').unwrap_or(rest).to_string());
                        } else if let Some(rest) = line.strip_prefix("id:") {
                            cur_id = Some(rest.strip_prefix(' ').unwrap_or(rest).to_string());
                        }
                        // Comment lines (":") and "retry:" are not surfaced —
                        // auto-reconnect is handled client-side instead.
                    }
                }
                Ok(Some(Err(e))) => {
                    let _ = task_app.emit("sse-status", SseStatusEvent { connection_id: task_id.clone(), status: "error", message: Some(e.to_string()) });
                    break;
                }
                Ok(None) => break, // stream ended normally
                Err(_) => continue, // read timed out — loop back to re-check cancel/pause
            }
        }

        let _ = task_app.emit("sse-status", SseStatusEvent { connection_id: task_id.clone(), status: "closed", message: None });
        task_manager.lock().await.remove(&task_id);
    });

    Ok(())
}

#[tauri::command]
pub async fn sse_disconnect(manager: State<'_, SseManager>, connection_id: String) -> Result<(), String> {
    let mut conns = manager.connections.lock().await;
    if let Some(handle) = conns.remove(&connection_id) {
        handle.cancelled.store(true, Ordering::Relaxed);
    }
    Ok(())
}

#[tauri::command]
pub async fn sse_set_paused(manager: State<'_, SseManager>, connection_id: String, paused: bool) -> Result<(), String> {
    let conns = manager.connections.lock().await;
    let Some(handle) = conns.get(&connection_id) else {
        return Err("Not connected".into());
    };
    handle.paused.store(paused, Ordering::Relaxed);
    Ok(())
}