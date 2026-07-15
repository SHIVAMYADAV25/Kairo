// // ---------------------------------------------------------------------------
// // Domain types. These mirror the Rust structs in src-tauri/src/models/*.rs
// // (serde-serialized 1:1) so IPC payloads are type-safe on both ends.
// // ---------------------------------------------------------------------------

// export type HttpMethod =
//   | "GET"
//   | "POST"
//   | "PUT"
//   | "PATCH"
//   | "DELETE"
//   | "HEAD"
//   | "OPTIONS";

// export type BodyType = "none" | "json" | "form-data" | "url-encoded" | "raw" | "binary";

// export type AuthType = "none" | "bearer" | "basic" | "api-key" | "oauth2";

// export interface KeyValuePair {
//   id: string;
//   key: string;
//   value: string;
//   description?: string;
//   enabled: boolean;
// }

// export interface FormDataField {
//   id: string;
//   key: string;
//   type: "text" | "file";
//   value: string; // text value or file path
//   enabled: boolean;
// }

// export interface AuthConfig {
//   type: AuthType;
//   bearer?: { token: string };
//   basic?: { username: string; password: string };
//   apiKey?: { key: string; value: string; location: "header" | "query" | "cookie" };
//   oauth2?: Record<string, string>;
// }

// export interface RequestSettings {
//   timeoutMs: number;
//   followRedirects: boolean;
//   maxRedirects: number;
//   sslVerification: boolean;
//   saveCookies: boolean;
// }

// export interface ScriptsConfig {
//   preRequest: string;
//   tests: string;
// }

// export interface RequestBody {
//   type: BodyType;
//   json?: string;
//   formData?: FormDataField[];
//   urlEncoded?: KeyValuePair[];
//   raw?: { content: string; language: "json" | "xml" | "html" | "text" };
//   binaryFilePath?: string;
// }

// export interface ApiRequest {
//   id: string;
//   collectionId: string | null;
//   name: string;
//   method: HttpMethod;
//   url: string;
//   params: KeyValuePair[];
//   headers: KeyValuePair[];
//   body: RequestBody;
//   auth: AuthConfig;
//   scripts: ScriptsConfig;
//   settings: RequestSettings;
//   updatedAt: string;
// }

// export interface TimingBreakdown {
//   dnsMs: number;
//   connectMs: number;
//   tlsMs: number;
//   ttfbMs: number;
//   downloadMs: number;
//   totalMs: number;
// }

// export interface TestResult {
//   name: string;
//   passed: boolean;
//   error?: string;
// }

// export interface ApiResponse {
//   status: number;
//   statusText: string;
//   httpVersion: string;
//   headers: Record<string, string>;
//   cookies: Cookie[];
//   body: string; // raw body, parsed lazily on the frontend for Tree view
//   contentType: string;
//   sizeBytes: number;
//   timing: TimingBreakdown;
//   testResults: TestResult[];
//   receivedAt: string;
// }

// export interface Cookie {
//   name: string;
//   value: string;
//   domain: string;
//   path: string;
//   expires: string | null;
// }

// export interface Collection {
//   id: string;
//   name: string;
//   parentId: string | null;
//   position: number;
// }

// export interface Environment {
//   id: string;
//   name: string;
//   isActive: boolean;
//   variables: KeyValuePair[];
// }

// export interface HistoryEntry {
//   id: string;
//   method: HttpMethod;
//   url: string;
//   status: number;
//   durationMs: number;
//   sizeBytes: number;
//   request: ApiRequest;
//   response: ApiResponse;
//   createdAt: string;
// }

// export interface RequestTab {
//   id: string;
//   requestId: string | null; // null = unsaved "New Request"
//   title: string;
//   isUnsaved: boolean;
//   request: ApiRequest;
//   response: ApiResponse | null;
//   isLoading: boolean;
//   error: string | null;
// }

// export interface AppSettings {
//   theme: "dark" | "light";
//   opaqueMode: boolean;
//   fontSizes: {
//     sidebar: number;
//     request: number;
//     response: number;
//   };
//   panelSizes: {
//     sidebarWidth: number;
//     requestEditorHeight: number;
//     responseViewerHeight: number;
//     performancePanelWidth: number;
//   };
//   lastEnvironmentId: string | null;
//   lastCollectionId: string | null;
// }

// ---------------------------------------------------------------------------
// Domain types. These mirror the Rust structs in src-tauri/src/models/*.rs
// (serde-serialized 1:1) so IPC payloads are type-safe on both ends.
// ---------------------------------------------------------------------------

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type BodyType = "none" | "json" | "form-data" | "url-encoded" | "raw" | "binary";

export type AuthType = "none" | "bearer" | "basic" | "api-key" | "oauth2";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface FormDataField {
  id: string;
  key: string;
  type: "text" | "file";
  value: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: AuthType;
  bearer?: { token: string };
  basic?: { username: string; password: string };
  apiKey?: { key: string; value: string; location: "header" | "query" | "cookie" };
  oauth2?: Record<string, string>;
}

export interface RequestSettings {
  timeoutMs: number;
  followRedirects: boolean;
  maxRedirects: number;
  sslVerification: boolean;
  saveCookies: boolean;
}

export interface ScriptsConfig {
  preRequest: string;
  tests: string;
}

export interface RequestBody {
  type: BodyType;
  json?: string;
  formData?: FormDataField[];
  urlEncoded?: KeyValuePair[];
  raw?: { content: string; language: "json" | "xml" | "html" | "text" };
  binaryFilePath?: string;
}

export interface ApiRequest {
  id: string;
  collectionId: string | null;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: RequestBody;
  auth: AuthConfig;
  scripts: ScriptsConfig;
  settings: RequestSettings;
  updatedAt: string;
}

export interface TimingBreakdown {
  dnsMs: number;
  connectMs: number;
  tlsMs: number;
  ttfbMs: number;
  downloadMs: number;
  totalMs: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: Record<string, string>;
  cookies: Cookie[];
  body: string;
  contentType: string;
  sizeBytes: number;
  timing: TimingBreakdown;
  testResults: TestResult[];
  receivedAt: string;
}

export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: string | null;
}

export interface Collection {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
}

export interface Environment {
  id: string;
  name: string;
  isActive: boolean;
  variables: KeyValuePair[];
}

export interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number;
  durationMs: number;
  sizeBytes: number;
  request: ApiRequest;
  response: ApiResponse;
  createdAt: string;
}

export interface RequestTab {
  id: string;
  requestId: string | null;
  title: string;
  isUnsaved: boolean;
  request: ApiRequest;
  response: ApiResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface AppSettings {
  theme: "dark" | "light";
  opaqueMode: boolean;
  fontSizes: {
    sidebar: number;
    request: number;
    response: number;
  };
  // Zoom level per panel. 13 is the default/medium (= 100% scale, no zoom).
  // Actual on-screen scale applied is (level / 13).
  zoomLevels: {
    sidebar: number;
    request: number;
    response: number;
  };
  panelSizes: {
    sidebarWidth: number;
    requestEditorHeight: number;
    responseViewerHeight: number;
    performancePanelWidth: number;
  };
  lastEnvironmentId: string | null;
  lastCollectionId: string | null;
  // --- Other Preferences ---
  restoreLastSession: boolean;
  defaultMethod: HttpMethod;
  defaultJsonFormat: "pretty" | "compact";
  responseWordWrap: boolean;
  confirmBeforeClosingUnsavedTabs: boolean;
}