use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "UPPERCASE")]
pub enum HttpMethod {
    Get,
    Post,
    Put,
    Patch,
    Delete,
    Head,
    Options,
}

impl HttpMethod {
    pub fn as_reqwest(&self) -> reqwest::Method {
        match self {
            HttpMethod::Get => reqwest::Method::GET,
            HttpMethod::Post => reqwest::Method::POST,
            HttpMethod::Put => reqwest::Method::PUT,
            HttpMethod::Patch => reqwest::Method::PATCH,
            HttpMethod::Delete => reqwest::Method::DELETE,
            HttpMethod::Head => reqwest::Method::HEAD,
            HttpMethod::Options => reqwest::Method::OPTIONS,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyValuePair {
    pub id: String,
    pub key: String,
    pub value: String,
    #[serde(default)]
    pub description: Option<String>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormDataField {
    pub id: String,
    pub key: String,
    #[serde(rename = "type")]
    pub field_type: String, // "text" | "file"
    pub value: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthConfig {
    #[serde(rename = "type")]
    pub auth_type: String, // "none" | "bearer" | "basic" | "api-key" | "oauth2"
    pub bearer: Option<BearerAuth>,
    pub basic: Option<BasicAuth>,
    pub api_key: Option<ApiKeyAuth>,
    pub oauth2: Option<std::collections::HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BearerAuth {
    pub token: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BasicAuth {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKeyAuth {
    pub key: String,
    pub value: String,
    pub location: String, // "header" | "query" | "cookie"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestSettings {
    pub timeout_ms: u64,
    pub follow_redirects: bool,
    pub max_redirects: u32,
    pub ssl_verification: bool,
    pub save_cookies: bool,
}

impl Default for RequestSettings {
    fn default() -> Self {
        Self {
            timeout_ms: 30_000,
            follow_redirects: true,
            max_redirects: 5,
            ssl_verification: true,
            save_cookies: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScriptsConfig {
    pub pre_request: String,
    pub tests: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestBody {
    #[serde(rename = "type")]
    pub body_type: String, // "none" | "json" | "form-data" | "url-encoded" | "raw" | "binary"
    pub json: Option<String>,
    pub form_data: Option<Vec<FormDataField>>,
    pub url_encoded: Option<Vec<KeyValuePair>>,
    pub raw: Option<RawBody>,
    pub binary_file_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawBody {
    pub content: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiRequest {
    pub id: String,
    pub collection_id: Option<String>,
    pub name: String,
    pub method: HttpMethod,
    pub url: String,
    pub params: Vec<KeyValuePair>,
    pub headers: Vec<KeyValuePair>,
    pub body: RequestBody,
    pub auth: AuthConfig,
    pub scripts: ScriptsConfig,
    pub settings: RequestSettings,
    pub updated_at: String,
}
