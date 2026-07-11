use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct TimingBreakdown {
    pub dns_ms: u64,
    pub connect_ms: u64,
    pub tls_ms: u64,
    pub ttfb_ms: u64,
    pub download_ms: u64,
    pub total_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TestResult {
    pub name: String,
    pub passed: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Cookie {
    pub name: String,
    pub value: String,
    pub domain: String,
    pub path: String,
    pub expires: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub status: u16,
    pub status_text: String,
    pub http_version: String,
    pub headers: HashMap<String, String>,
    pub cookies: Vec<Cookie>,
    pub body: String,
    pub content_type: String,
    pub size_bytes: u64,
    pub timing: TimingBreakdown,
    pub test_results: Vec<TestResult>,
    pub received_at: String,
}
