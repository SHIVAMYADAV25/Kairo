use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::http::{HeaderName, HeaderValue};
use tokio_tungstenite::tungstenite::Message as TMessage;

#[derive(Default)]
pub struct WsManager {
    connections: Arc<Mutex<HashMap<String, mpsc::UnboundedSender<WsOutbound>>>>,
}

enum WsOutbound {
    Text(String),
    Binary(Vec<u8>),
    Close,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WsMessageEvent {
    connection_id: String,
    direction: &'static str,
    is_binary: bool,
    data: String,
    timestamp: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct WsStatusEvent {
    connection_id: String,
    status: &'static str,
    message: Option<String>,
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

#[tauri::command]
pub async fn ws_connect(
    app: AppHandle,
    manager: State<'_, WsManager>,
    connection_id: String,
    url: String,
    headers: Vec<(String, String)>,
) -> Result<(), String> {
    // Tear down any existing connection registered under this id.
    if let Some(existing) = manager.connections.lock().await.remove(&connection_id) {
        let _ = existing.send(WsOutbound::Close);
    }

    let _ = app.emit(
        "ws-status",
        WsStatusEvent { connection_id: connection_id.clone(), status: "connecting", message: None },
    );

    let mut request = url
        .clone()
        .into_client_request()
        .map_err(|e| e.to_string())?;
    for (k, v) in &headers {
        if let (Ok(name), Ok(value)) = (HeaderName::from_bytes(k.as_bytes()), HeaderValue::from_str(v)) {
            request.headers_mut().insert(name, value);
        }
    }

    let ws_stream = match tokio_tungstenite::connect_async(request).await {
        Ok((stream, _response)) => stream,
        Err(e) => {
            let _ = app.emit(
                "ws-status",
                WsStatusEvent { connection_id: connection_id.clone(), status: "error", message: Some(e.to_string()) },
            );
            return Err(e.to_string());
        }
    };

    let (mut write, mut read) = ws_stream.split();
    let (out_tx, mut out_rx) = mpsc::unbounded_channel::<WsOutbound>();
    manager.connections.lock().await.insert(connection_id.clone(), out_tx.clone());

    let _ = app.emit(
        "ws-status",
        WsStatusEvent { connection_id: connection_id.clone(), status: "open", message: None },
    );

    // Reader: forwards every incoming frame to the frontend as an event.
    let read_app = app.clone();
    let read_id = connection_id.clone();
    let reader = tokio::spawn(async move {
        while let Some(msg) = read.next().await {
            match msg {
                Ok(TMessage::Text(text)) => {
                    let _ = read_app.emit(
                        "ws-message",
                        WsMessageEvent { connection_id: read_id.clone(), direction: "received", is_binary: false, data: text, timestamp: now() },
                    );
                }
                Ok(TMessage::Binary(bytes)) => {
                    let _ = read_app.emit(
                        "ws-message",
                        WsMessageEvent { connection_id: read_id.clone(), direction: "received", is_binary: true, data: base64_encode(&bytes), timestamp: now() },
                    );
                }
                Ok(TMessage::Close(_)) => break,
                Ok(_) => {} // ping/pong are handled internally by tungstenite
                Err(e) => {
                    let _ = read_app.emit(
                        "ws-status",
                        WsStatusEvent { connection_id: read_id.clone(), status: "error", message: Some(e.to_string()) },
                    );
                    break;
                }
            }
        }
        let _ = read_app.emit(
            "ws-status",
            WsStatusEvent { connection_id: read_id.clone(), status: "closed", message: None },
        );
    });

    // Writer: drains outgoing messages until the channel closes or an
    // explicit Close is sent (from ws_disconnect or a reconnect superseding
    // this connection).
    let write_id = connection_id.clone();
    let write_manager = manager.connections.clone();
    let this_tx = out_tx.clone();
    tokio::spawn(async move {
        while let Some(out) = out_rx.recv().await {
            let is_close = matches!(out, WsOutbound::Close);
            let sent = match out {
                WsOutbound::Text(t) => write.send(TMessage::Text(t)).await,
                WsOutbound::Binary(b) => write.send(TMessage::Binary(b)).await,
                WsOutbound::Close => write.send(TMessage::Close(None)).await,
            };
            if sent.is_err() || is_close {
                break;
            }
        }
        let _ = write.close().await;
        reader.abort();
        // Reconnecting under the same connection_id inserts a *new* sender
        // into the map before this old connection's cleanup runs. Without
        // this check, that cleanup would blindly remove-by-key and evict
        // the new, still-live connection's entry — leaving ws_send /
        // ws_disconnect unable to find it even though it's open.
        let mut conns = write_manager.lock().await;
        if conns.get(&write_id).map_or(false, |existing| existing.same_channel(&this_tx)) {
            conns.remove(&write_id);
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn ws_send(
    manager: State<'_, WsManager>,
    connection_id: String,
    data: String,
    is_binary: bool,
) -> Result<(), String> {
    let conns = manager.connections.lock().await;
    let Some(tx) = conns.get(&connection_id) else {
        return Err("Not connected".into());
    };
    let outbound = if is_binary {
        WsOutbound::Binary(base64_decode(&data)?)
    } else {
        WsOutbound::Text(data)
    };
    tx.send(outbound).map_err(|_| "Connection closed".to_string())
}

#[tauri::command]
pub async fn ws_disconnect(manager: State<'_, WsManager>, connection_id: String) -> Result<(), String> {
    let mut conns = manager.connections.lock().await;
    if let Some(tx) = conns.remove(&connection_id) {
        let _ = tx.send(WsOutbound::Close);
    }
    Ok(())
}

// Small dependency-free base64 helpers (avoids pulling in a whole crate).
fn base64_encode(bytes: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0];
        let b1 = *chunk.get(1).unwrap_or(&0);
        let b2 = *chunk.get(2).unwrap_or(&0);
        out.push(CHARS[(b0 >> 2) as usize] as char);
        out.push(CHARS[(((b0 & 0x03) << 4) | (b1 >> 4)) as usize] as char);
        out.push(if chunk.len() > 1 { CHARS[(((b1 & 0x0f) << 2) | (b2 >> 6)) as usize] as char } else { '=' });
        out.push(if chunk.len() > 2 { CHARS[(b2 & 0x3f) as usize] as char } else { '=' });
    }
    out
}

fn base64_decode(s: &str) -> Result<Vec<u8>, String> {
    fn val(c: u8) -> Option<u8> {
        match c {
            b'A'..=b'Z' => Some(c - b'A'),
            b'a'..=b'z' => Some(c - b'a' + 26),
            b'0'..=b'9' => Some(c - b'0' + 52),
            b'+' => Some(62),
            b'/' => Some(63),
            _ => None,
        }
    }
    let clean: Vec<u8> = s.bytes().filter(|&b| b != b'=' && !b.is_ascii_whitespace()).collect();
    let mut out = Vec::new();
    for chunk in clean.chunks(4) {
        let vals: Vec<u8> = chunk.iter().filter_map(|&b| val(b)).collect();
        if vals.is_empty() {
            continue;
        }
        out.push((vals[0] << 2) | (vals.get(1).unwrap_or(&0) >> 4));
        if vals.len() > 2 {
            out.push((vals[1] << 4) | (vals[2] >> 2));
        }
        if vals.len() > 3 {
            out.push((vals[2] << 6) | vals[3]);
        }
    }
    Ok(out)
}