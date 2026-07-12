use super::request::{ApiRequest, KeyValuePair};
use super::response::ApiResponse;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Collection {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub position: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Environment {
    pub id: String,
    pub name: String,
    pub is_active: bool,
    pub variables: Vec<KeyValuePair>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub method: super::request::HttpMethod,
    pub url: String,
    pub status: u16,
    pub duration_ms: u64,
    pub size_bytes: u64,
    pub request: ApiRequest,
    pub response: ApiResponse,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontSizes {
    pub sidebar: u32,
    pub request: u32,
    pub response: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PanelSizes {
    pub sidebar_width: u32,
    pub request_editor_height: u32,
    pub response_viewer_height: u32,
    pub performance_panel_width: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub opaque_mode: bool,
    pub font_sizes: FontSizes,
    pub panel_sizes: PanelSizes,
    pub last_environment_id: Option<String>,
    pub last_collection_id: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".into(),
            opaque_mode: true,
            font_sizes: FontSizes { sidebar: 15, request: 13, response: 12 },
            panel_sizes: PanelSizes {
                sidebar_width: 260,
                request_editor_height: 340,
                response_viewer_height: 420,
                performance_panel_width: 280,
            },
            last_environment_id: None,
            last_collection_id: None,
        }
    }
}