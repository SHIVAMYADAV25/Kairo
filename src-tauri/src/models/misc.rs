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

// Zoom is stored as a plain "size level" (same unit family as FontSizes),
// default 13 = medium/100% scale for that panel. Each panel's rendered
// content is scaled by (level / 13) on the frontend, so 13 always means
// "no zoom" regardless of range tweaks later.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZoomLevels {
    pub sidebar: u32,
    pub request: u32,
    pub response: u32,
}

impl Default for ZoomLevels {
    fn default() -> Self {
        Self { sidebar: 12, request: 12, response: 12 }
    }
}

// `default` at the container level means any field missing from an
// old/persisted settings blob (e.g. after this update adds new fields)
// falls back to AppSettings::default() for that field instead of failing
// to deserialize — so this is safe to add fields to without a migration.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", default)]
pub struct AppSettings {
    pub theme: String,
    pub opaque_mode: bool,
    pub font_sizes: FontSizes,
    pub panel_sizes: PanelSizes,
    pub zoom_levels: ZoomLevels,
    pub last_environment_id: Option<String>,
    pub last_collection_id: Option<String>,
    pub restore_last_session: bool,
    pub default_method: String,
    pub default_json_format: String,
    pub response_word_wrap: bool,
    pub confirm_before_closing_unsaved_tabs: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "dark".into(),
            opaque_mode: true,
            font_sizes: FontSizes { sidebar: 12, request: 12, response: 12 },
            zoom_levels: ZoomLevels::default(),
            panel_sizes: PanelSizes {
                sidebar_width: 230,
                request_editor_height: 480,
                response_viewer_height: 420,
                performance_panel_width: 240,
            },
            last_environment_id: None,
            last_collection_id: None,
            restore_last_session: true,
            default_method: "GET".into(),
            default_json_format: "pretty".into(),
            response_word_wrap: false,
            confirm_before_closing_unsaved_tabs: true,
        }
    }
}