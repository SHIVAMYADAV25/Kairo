# Kairo

**Fast. Lightweight. Rust-powered.**

Kairo is a Postman/Insomnia-class API client — REST, GraphQL, WebSockets, SSE, mock
servers, and load testing in one app — built with **React + TypeScript** on the
frontend and **Rust + Tauri 2** on the backend.

---

## Table of contents

- [Why this stack](#why-this-stack)
- [Feature guide](#feature-guide)
  - [1. Request Builder](#1-request-builder)
  - [2. Response Viewer](#2-response-viewer)
  - [3. Performance Panel](#3-performance-panel)
  - [4. Collections & Sidebar](#4-collections--sidebar)
  - [5. Environments](#5-environments)
  - [6. Tabs](#6-tabs)
  - [7. Import](#7-import)
  - [8. WebSockets (Sockets)](#8-websockets-sockets)
  - [9. Server-Sent Events (SSE)](#9-server-sent-events-sse)
  - [10. GraphQL](#10-graphql)
  - [11. Mock Server](#11-mock-server)
  - [12. Tests & Load Testing](#12-tests--load-testing)
  - [13. Settings](#13-settings)
  - [14. Auto-Updater](#14-auto-updater)
  - [15. About / Dev-note modal](#15-about--dev-note-modal)
- [Data & storage](#data--storage)
- [Project layout](#project-layout)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Building installers](#building-installers-for-all-3-platforms)
- [CI / automated releases](#ci--automated-releases)
- [Icons](#icons)
- [Known limitations / roadmap](#known-limitations--roadmap)

---

## Why this stack

- **Tauri, not Electron.** Tauri uses the OS's native webview (WebView2 on Windows,
  WKWebView on macOS, WebKitGTK on Linux) instead of bundling a full Chromium
  runtime — a multi-MB installer instead of 100MB+, and tens of MB of idle RAM
  instead of 150MB+.
- **All heavy lifting happens in Rust, not the webview's JS thread:**
  - HTTP execution via `reqwest`/`hyper` with real phase timing (TTFB, download) —
    not a browser `fetch()`, which can't expose this and is also blocked by CORS
    for arbitrary APIs.
  - SQLite (via `rusqlite` + `r2d2` pooling, WAL mode) for collections, requests,
    history, environments, and settings — scales to tens of thousands of history
    rows with indexed lookups, unlike `localStorage`.
  - Pre-request/test scripts run in an embedded QuickJS sandbox (`rquickjs`) — no
    bundled Node.js runtime required.
  - WebSocket, SSE, and mock-server connections are all managed as native Rust
    tasks (`tokio-tungstenite`, `reqwest`, a small `hyper`-based mock listener)
    that stream events to the frontend over Tauri's event bus — the webview
    never opens a raw socket itself.
- **React is fine here** because the IPC boundary means most re-renders are local
  to a panel (Params table, response tree, performance gauge) — one `invoke()`
  per action, not chatty round trips.
- **Release profile tuned for size/startup**: LTO, single codegen unit,
  `opt-level = "z"`, stripped symbols (see `src-tauri/Cargo.toml`).

---

## Feature guide

### 1. Request Builder

*(`src/components/RequestBuilder/`)*

The main panel for composing a request, with the standard tab set:

| Tab | What it does |
|---|---|
| **Params** | Key/value query-string editor (`KeyValueTable.tsx`); rows sync bidirectionally with the URL bar. |
| **Headers** | Key/value header editor, same table component. |
| **Body** | `none`, `json` (Monaco editor with formatting), `form-data` (multipart, file + text fields via `FormDataTable.tsx`), `url-encoded`, `raw`, `binary`. |
| **Auth** | `none`, `bearer`, `basic`, `api-key`, `oauth2` — auth values are substituted into the request the same way as environment variables. |
| **Scripts** | Pre-request and test scripts, each in a Monaco editor, executed in an embedded **QuickJS** sandbox in Rust (`commands/scripts.rs`) — no Node.js needed, and scripts can't touch the filesystem or network directly. |
| **Settings** | Per-request overrides: timeout (ms), follow redirects, max redirects, SSL certificate verification toggle. |
| **Code** | Live-generated request snippets in cURL, JavaScript (Fetch/Axios), Node.js, Python (Requests), Go, Rust (reqwest), Java, and PHP — regenerated on every field change, with environment variables already substituted (`lib/codegen.ts`). |

Also in this area:
- **URL bar** (`UrlBar.tsx`) parses pasted cURL commands automatically and can
  also import one explicitly via **Import cURL** (`CurlImportModal.tsx`).
- **Save Request** (`SaveRequestModal.tsx`) saves the current tab into a
  collection/folder.

### 2. Response Viewer

*(`src/components/ResponseViewer/`)*

| Tab | What it does |
|---|---|
| **Response** | Collapsible JSON tree (`JsonTree.tsx`) with click-to-copy JS path (e.g. `data.users[0].name`), plus a **Raw** / **Pretty** toggle and configurable indent width. |
| **Headers** | Response headers, tab badge shows the count. |
| **Cookies** | Cookies set by the response. |
| **Tests** | Results of the request's test script (pass/fail per assertion); tab badge shows the count. |
| **Raw** | Unformatted response body. |
| **Preview** | Rendered preview for HTML/image responses. |

The status bar (`StatusBar.tsx`) shows status code, total time, and response
size, colored by status class (2xx/3xx/4xx/5xx).

### 3. Performance Panel

*(`src/components/PerformancePanel/`)*

A right-hand panel (toggleable) showing:
- A circular gauge for **total response time** on the most recent send.
- A **TTFB** / **download** / **total** breakdown.
- A rolling bar chart of response times across recent requests, filterable by
  window (1m/5m/15m/1h), built with `recharts`.
- Response metadata: status, HTTP version, content type, content length, date.

All timings come from real Rust-side instrumentation around the `reqwest` call
— not `performance.now()` around a `fetch()`, which can't see TTFB.

### 4. Collections & Sidebar

*(`src/components/Sidebar/`, `stores/collectionStore.ts`)*

- **Collections panel** — nested folder tree of saved requests, create/rename/
  delete/reorder collections and folders, drag requests between them.
- **History panel** — every sent request is logged (capped, indexed in SQLite)
  with full-text search across URL/method.
- **Icon rail** — left-hand navigation between Collections, Environments,
  History, Sockets, GraphQL, SSE, Mocks, Tests, Settings, and the About modal
  (bottom user icon).

### 5. Environments

*(`src/features/environments/`, `stores/environmentStore.ts`)*

- Two-pane **Environments modal**: environment list on the left, key/value
  variable editor on the right (also reachable as its own sidebar panel).
- Active environment is switchable from the top-right selector next to the
  request tabs.
- `{{VAR}}` syntax is substituted into URL, params, headers, body, and auth
  fields — substitution happens in Rust (`commands/env.rs`) right before the
  request is sent, so it's correct even for scripted/dynamic values.

### 6. Tabs

*(`stores/tabStore.ts`, `stores/openTabsStore.ts`, `src/components/Tabs/`)*

- Multiple request tabs open at once, each with its own unsaved-changes dot.
- Tabs (and their in-progress edits) are persisted to SQLite and restored on
  next launch if **Restore Last Session** is enabled in Settings.

### 7. Import

*(`src-tauri/src/commands/import.rs`, `postman_parser.rs`, `openapi_parser.rs`)*

- **Import from URL** or **Import from file**, supporting:
  - **Postman Collection v2.1** JSON — folders, requests, auth, and bodies are
    walked recursively into Kairo's collection tree.
  - **OpenAPI / Swagger** specs (JSON or YAML) — every `path`/`operation` becomes
    a request, grouped by tag into folders.
  - Raw **cURL** commands, pasted directly into the URL bar or via the
    **Import cURL** modal.

### 8. WebSockets (Sockets)

*(`src/features/sockets/SocketsModal.tsx`, `src-tauri/src/commands/ws.rs`, `stores/socketStore.ts`)*

- Connect to any `ws://`/`wss://` URL with custom headers.
- Send text or binary frames; full message log with direction (sent/received),
  timestamp, and payload, streamed from a native `tokio-tungstenite` connection
  over Tauri events — not the browser's `WebSocket` API, so it isn't subject to
  webview CSP/mixed-content restrictions.
- Multiple simultaneous connections are tracked independently by connection ID.

### 9. Server-Sent Events (SSE)

*(`src/features/sse/SseModal.tsx`, `src-tauri/src/commands/sse.rs`)*

- Connect to any SSE endpoint; events stream in as they arrive, each shown with
  event type, ID, and payload in a scrollable log.
- Pause/resume the stream without disconnecting, and reconnect on demand.

### 10. GraphQL

*(`src/features/graphql/GraphqlModal.tsx`, `stores/graphqlStore.ts`, `lib/graphql.ts`)*

- Multi-operation workspace (tabs within the modal) with **Query**,
  **Variables**, **Headers**, and **Schema** sub-tabs.
- **Schema introspection** — fetches the endpoint's schema and lists queryable/
  mutable fields for reference while writing operations.
- Built-in query formatter and one-click copy.

### 11. Mock Server

*(`src/features/mocks/MockServerModal.tsx`, `src-tauri/src/commands/mock.rs`)*

- Spins up a real local HTTP server (configurable port) directly from Rust —
  define routes (method + path), status code, response delay, response body,
  and custom response headers.
- **Template variables** in the response body, resolved per-request:
  `{{$uuid}}`, `{{$timestamp}}`, `{{$isoTimestamp}}`, `{{$randomInt}}` /
  `{{$randomInt(min,max)}}`, `{{$randomFloat}}`, `{{$randomBool}}`,
  `{{$randomString}}`, `{{$randomEmail}}`.
- Live **request log** showing every hit the mock server receives, with
  method, path, status, and duration.
- Routes can be toggled on/off individually without deleting them.

### 12. Tests & Load Testing

*(`src/features/tests/TestsModal.tsx`, `src/features/runner/RunnerModal.tsx`, `stores/runnerStore.ts`, `stores/loadTestStore.ts`, `src-tauri/src/commands/loadtest.rs`)*

Two related but distinct tools:

- **Collection Runner** (`RunnerModal.tsx`) — runs every request in a collection
  sequentially, showing pass/fail/duration per request and an overall summary.
  Reachable from a collection's context menu.
- **Tests panel** (`TestsModal.tsx`), with several test shapes:
  - **Load Test** — constant virtual users for a fixed duration.
  - **Stress Test** — ramps VUs up over time to find breaking points.
  - **Spike Test** — sudden burst of traffic, then recovery.
  - **Soak Test** — sustained load over an extended period (presets from 1m to 2h).
  - **Response Assertions** — validate status code, response time threshold,
    and body content for a single request.
  - **Chain / Sequence Test** — runs requests from a collection in order,
    passing variables between steps.

  Load/stress/spike/soak tests execute in Rust (`commands/loadtest.rs`) using
  real concurrent HTTP workers, not simulated in the webview — progress
  (VUs active, requests/sec, error rate, latency percentiles) streams back
  live via Tauri events.

### 13. Settings

*(`src/components/Settings/SettingsDrawer.tsx`, `stores/settingsStore.ts`)*

- **Appearance** — Dark / Light theme toggle, Opaque Mode (solid vs. translucent
  panel backgrounds).
- **Font Dimension Metrics** — independent font-size steppers for the Sidebar,
  Request Panel, and Response Panel.
- **Zoom Level** — independent UI scale (layout, icons, and text) per panel.
- **Preferences** — Restore Last Session, Default HTTP Method, default JSON
  formatting style (Pretty/Compact), Response Word Wrap, Confirm Before Closing
  (unsaved-tab guard).
- Panel sizes (sidebar width, request-editor height, performance-panel width)
  are independently draggable and debounce-persisted, along with every setting
  above, to the SQLite `app_settings` table so they survive a restart.

### 14. Auto-Updater

*(`src/features/updater/`)*

- Checks for new releases in the background (`useAutoUpdate.ts`) using Tauri's
  updater plugin, and shows an in-app `UpdateModal.tsx` with release notes and
  a one-click install-and-restart, instead of sending the user to a download page.

### 15. About / Dev-note modal

*(`src/features/about/AboutDevModal.tsx`)*

- Opened from the user icon at the bottom of the sidebar.
- A short note from the developer plus X/LinkedIn contact links (opened via
  the Tauri **shell** plugin so they launch the system browser, since a
  webview has no "open in new tab" chrome of its own).
- A small interactive easter egg: a draggable mask overlay on an image,
  themed for both light and dark mode.

---

## Data & storage

Everything below lives in a single SQLite database file (WAL mode, connection-
pooled via `r2d2`), versioned with SQL migrations in `src-tauri/src/db/migrations/`:

- Collections & folders (with ordering)
- Saved requests
- Request history (capped, indexed for search)
- Environments & variables
- Persisted open tabs (for session restore)
- App settings (theme, fonts, zoom, panel sizes, preferences)

No data is sent anywhere — Kairo is entirely local-first; the only outbound
network calls are the ones *you* configure (the requests you send, imports you
trigger, and update checks).

---

## Project layout

```
kairo/
├─ src/                        React + TypeScript frontend
│  ├─ components/               Sidebar, Tabs, RequestBuilder, ResponseViewer,
│  │                             PerformancePanel, Settings, common (shared modals)
│  ├─ features/                 environments/, sockets/, sse/, graphql/, mocks/,
│  │                             tests/, runner/, updater/, about/
│  ├─ stores/                   zustand stores — one per domain (tabs, settings,
│  │                             environments, collections, sockets, sse, graphql,
│  │                             mock, runner, load test)
│  ├─ lib/                      typed IPC wrapper (api.ts), codegen, graphql helpers,
│  │                             factories
│  └─ types/                    shared TS types, mirrored 1:1 by Rust structs
├─ src-tauri/                   Rust backend
│  ├─ src/commands/              tauri commands: http, ws, sse, mock, loadtest,
│  │                             scripts, storage, env, import (+ postman/openapi parsers)
│  ├─ src/storage/                SQLite access layer, one module per entity
│  ├─ src/db/migrations/          versioned SQL migrations
│  ├─ src/models/                 serde structs mirroring src/types/index.ts
│  ├─ capabilities/               Tauri permission manifests
│  └─ tauri.conf.json             window + bundle target config
└─ kairo-landing/                separate Next.js marketing site (not part of the app)
```

## Prerequisites

- Node.js 18+
- Rust (stable, via [rustup](https://rustup.rs))
- Platform build tools:
  - **Windows**: Microsoft C++ Build Tools + WebView2 (usually preinstalled on Win 10/11)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`,
    `librsvg2-dev`, `build-essential` (Debian/Ubuntu package names)

## Setup

```bash
npm install
npm run tauri dev      # launches the app with hot reload
```

> Note: some Rust-side changes (backend defaults, new Tauri commands, new
> capability permissions) require a full restart of `tauri dev`, not just a
> frontend hot-reload — the Rust binary itself has to recompile.

## Building installers for all 3 platforms

Tauri cross-compiles best when built **on** each target OS (or via CI runners
for each OS — GitHub Actions is the common approach for a single repo that
ships to all three).

```bash
npm run tauri build
```

This produces, per OS it's run on:

| OS | Artifacts | Location |
|---|---|---|
| Windows | `.msi`, `.exe` (NSIS) | `src-tauri/target/release/bundle/{msi,nsis}` |
| macOS | `.app`, `.dmg` | `src-tauri/target/release/bundle/{macos,dmg}` |
| Linux | `.AppImage`, `.deb`, `.rpm` | `src-tauri/target/release/bundle/{appimage,deb,rpm}` |

Target list is already set in `src-tauri/tauri.conf.json` → `bundle.targets`.

## CI / automated releases

Two workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push/PR to `main`: type-checks and builds the
  frontend so broken TypeScript never reaches a release build.
- **`release.yml`** — builds **all three platforms in parallel** (Windows
  `.msi`/`.exe`, macOS `.dmg` for both Apple Silicon and Intel, Linux
  `.AppImage`/`.deb`/`.rpm`) and attaches them as a **draft GitHub Release**
  whenever you push a version tag:

  ```bash
  git tag v1.1.2
  git push --tags
  ```

  Go to your repo's **Releases** tab, review the draft, and publish it — that's
  the file you hand to Windows/macOS/Linux users, each downloading only the
  artifact for their own OS. Typical end-to-end runtime on GitHub's free
  runners is 15–25 minutes across the 4 parallel jobs. No local Windows/Mac/
  Linux machines needed — GitHub's hosted runners do the OS-specific compiling.

## Icons

Icons live in `src-tauri/icons/`. To regenerate a full multi-resolution set
from a new source image:

```bash
npm run tauri icon path/to/source-1024.png
```

## Known limitations / roadmap

- **Form-data multipart body construction** — the UI for adding fields exists
  (`FormDataTable.tsx`); the multipart encode/send path is the next increment.
- **DNS/connect/TLS phase timing breakdown** — TTFB, download, and total are
  real today; a finer-grained breakdown needs a custom `hyper` connector.
- **Drag-and-drop reordering** in the collection tree beyond folder-level
  reorder is still basic.

Every feature above was designed to be additive — new SQL migrations, new
command modules, new feature folders — without touching existing code paths,
so extending any of them shouldn't require restructuring what's already there.# Kairo

**Fast. Lightweight. Rust-powered.**

Kairo is a Postman/Insomnia-class API client — REST, GraphQL, WebSockets, SSE, mock
servers, and load testing in one app — built with **React + TypeScript** on the
frontend and **Rust + Tauri 2** on the backend.

---

## Table of contents

- [Why this stack](#why-this-stack)
- [Feature guide](#feature-guide)
  - [1. Request Builder](#1-request-builder)
  - [2. Response Viewer](#2-response-viewer)
  - [3. Performance Panel](#3-performance-panel)
  - [4. Collections & Sidebar](#4-collections--sidebar)
  - [5. Environments](#5-environments)
  - [6. Tabs](#6-tabs)
  - [7. Import](#7-import)
  - [8. WebSockets (Sockets)](#8-websockets-sockets)
  - [9. Server-Sent Events (SSE)](#9-server-sent-events-sse)
  - [10. GraphQL](#10-graphql)
  - [11. Mock Server](#11-mock-server)
  - [12. Tests & Load Testing](#12-tests--load-testing)
  - [13. Settings](#13-settings)
  - [14. Auto-Updater](#14-auto-updater)
  - [15. About / Dev-note modal](#15-about--dev-note-modal)
- [Data & storage](#data--storage)
- [Project layout](#project-layout)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Building installers](#building-installers-for-all-3-platforms)
- [CI / automated releases](#ci--automated-releases)
- [Icons](#icons)
- [Known limitations / roadmap](#known-limitations--roadmap)

---

## Why this stack

- **Tauri, not Electron.** Tauri uses the OS's native webview (WebView2 on Windows,
  WKWebView on macOS, WebKitGTK on Linux) instead of bundling a full Chromium
  runtime — a multi-MB installer instead of 100MB+, and tens of MB of idle RAM
  instead of 150MB+.
- **All heavy lifting happens in Rust, not the webview's JS thread:**
  - HTTP execution via `reqwest`/`hyper` with real phase timing (TTFB, download) —
    not a browser `fetch()`, which can't expose this and is also blocked by CORS
    for arbitrary APIs.
  - SQLite (via `rusqlite` + `r2d2` pooling, WAL mode) for collections, requests,
    history, environments, and settings — scales to tens of thousands of history
    rows with indexed lookups, unlike `localStorage`.
  - Pre-request/test scripts run in an embedded QuickJS sandbox (`rquickjs`) — no
    bundled Node.js runtime required.
  - WebSocket, SSE, and mock-server connections are all managed as native Rust
    tasks (`tokio-tungstenite`, `reqwest`, a small `hyper`-based mock listener)
    that stream events to the frontend over Tauri's event bus — the webview
    never opens a raw socket itself.
- **React is fine here** because the IPC boundary means most re-renders are local
  to a panel (Params table, response tree, performance gauge) — one `invoke()`
  per action, not chatty round trips.
- **Release profile tuned for size/startup**: LTO, single codegen unit,
  `opt-level = "z"`, stripped symbols (see `src-tauri/Cargo.toml`).

---

## Feature guide

### 1. Request Builder

*(`src/components/RequestBuilder/`)*

The main panel for composing a request, with the standard tab set:

| Tab | What it does |
|---|---|
| **Params** | Key/value query-string editor (`KeyValueTable.tsx`); rows sync bidirectionally with the URL bar. |
| **Headers** | Key/value header editor, same table component. |
| **Body** | `none`, `json` (Monaco editor with formatting), `form-data` (multipart, file + text fields via `FormDataTable.tsx`), `url-encoded`, `raw`, `binary`. |
| **Auth** | `none`, `bearer`, `basic`, `api-key`, `oauth2` — auth values are substituted into the request the same way as environment variables. |
| **Scripts** | Pre-request and test scripts, each in a Monaco editor, executed in an embedded **QuickJS** sandbox in Rust (`commands/scripts.rs`) — no Node.js needed, and scripts can't touch the filesystem or network directly. |
| **Settings** | Per-request overrides: timeout (ms), follow redirects, max redirects, SSL certificate verification toggle. |
| **Code** | Live-generated request snippets in cURL, JavaScript (Fetch/Axios), Node.js, Python (Requests), Go, Rust (reqwest), Java, and PHP — regenerated on every field change, with environment variables already substituted (`lib/codegen.ts`). |

Also in this area:
- **URL bar** (`UrlBar.tsx`) parses pasted cURL commands automatically and can
  also import one explicitly via **Import cURL** (`CurlImportModal.tsx`).
- **Save Request** (`SaveRequestModal.tsx`) saves the current tab into a
  collection/folder.

### 2. Response Viewer

*(`src/components/ResponseViewer/`)*

| Tab | What it does |
|---|---|
| **Response** | Collapsible JSON tree (`JsonTree.tsx`) with click-to-copy JS path (e.g. `data.users[0].name`), plus a **Raw** / **Pretty** toggle and configurable indent width. |
| **Headers** | Response headers, tab badge shows the count. |
| **Cookies** | Cookies set by the response. |
| **Tests** | Results of the request's test script (pass/fail per assertion); tab badge shows the count. |
| **Raw** | Unformatted response body. |
| **Preview** | Rendered preview for HTML/image responses. |

The status bar (`StatusBar.tsx`) shows status code, total time, and response
size, colored by status class (2xx/3xx/4xx/5xx).

### 3. Performance Panel

*(`src/components/PerformancePanel/`)*

A right-hand panel (toggleable) showing:
- A circular gauge for **total response time** on the most recent send.
- A **TTFB** / **download** / **total** breakdown.
- A rolling bar chart of response times across recent requests, filterable by
  window (1m/5m/15m/1h), built with `recharts`.
- Response metadata: status, HTTP version, content type, content length, date.

All timings come from real Rust-side instrumentation around the `reqwest` call
— not `performance.now()` around a `fetch()`, which can't see TTFB.

### 4. Collections & Sidebar

*(`src/components/Sidebar/`, `stores/collectionStore.ts`)*

- **Collections panel** — nested folder tree of saved requests, create/rename/
  delete/reorder collections and folders, drag requests between them.
- **History panel** — every sent request is logged (capped, indexed in SQLite)
  with full-text search across URL/method.
- **Icon rail** — left-hand navigation between Collections, Environments,
  History, Sockets, GraphQL, SSE, Mocks, Tests, Settings, and the About modal
  (bottom user icon).

### 5. Environments

*(`src/features/environments/`, `stores/environmentStore.ts`)*

- Two-pane **Environments modal**: environment list on the left, key/value
  variable editor on the right (also reachable as its own sidebar panel).
- Active environment is switchable from the top-right selector next to the
  request tabs.
- `{{VAR}}` syntax is substituted into URL, params, headers, body, and auth
  fields — substitution happens in Rust (`commands/env.rs`) right before the
  request is sent, so it's correct even for scripted/dynamic values.

### 6. Tabs

*(`stores/tabStore.ts`, `stores/openTabsStore.ts`, `src/components/Tabs/`)*

- Multiple request tabs open at once, each with its own unsaved-changes dot.
- Tabs (and their in-progress edits) are persisted to SQLite and restored on
  next launch if **Restore Last Session** is enabled in Settings.

### 7. Import

*(`src-tauri/src/commands/import.rs`, `postman_parser.rs`, `openapi_parser.rs`)*

- **Import from URL** or **Import from file**, supporting:
  - **Postman Collection v2.1** JSON — folders, requests, auth, and bodies are
    walked recursively into Kairo's collection tree.
  - **OpenAPI / Swagger** specs (JSON or YAML) — every `path`/`operation` becomes
    a request, grouped by tag into folders.
  - Raw **cURL** commands, pasted directly into the URL bar or via the
    **Import cURL** modal.

### 8. WebSockets (Sockets)

*(`src/features/sockets/SocketsModal.tsx`, `src-tauri/src/commands/ws.rs`, `stores/socketStore.ts`)*

- Connect to any `ws://`/`wss://` URL with custom headers.
- Send text or binary frames; full message log with direction (sent/received),
  timestamp, and payload, streamed from a native `tokio-tungstenite` connection
  over Tauri events — not the browser's `WebSocket` API, so it isn't subject to
  webview CSP/mixed-content restrictions.
- Multiple simultaneous connections are tracked independently by connection ID.

### 9. Server-Sent Events (SSE)

*(`src/features/sse/SseModal.tsx`, `src-tauri/src/commands/sse.rs`)*

- Connect to any SSE endpoint; events stream in as they arrive, each shown with
  event type, ID, and payload in a scrollable log.
- Pause/resume the stream without disconnecting, and reconnect on demand.

### 10. GraphQL

*(`src/features/graphql/GraphqlModal.tsx`, `stores/graphqlStore.ts`, `lib/graphql.ts`)*

- Multi-operation workspace (tabs within the modal) with **Query**,
  **Variables**, **Headers**, and **Schema** sub-tabs.
- **Schema introspection** — fetches the endpoint's schema and lists queryable/
  mutable fields for reference while writing operations.
- Built-in query formatter and one-click copy.

### 11. Mock Server

*(`src/features/mocks/MockServerModal.tsx`, `src-tauri/src/commands/mock.rs`)*

- Spins up a real local HTTP server (configurable port) directly from Rust —
  define routes (method + path), status code, response delay, response body,
  and custom response headers.
- **Template variables** in the response body, resolved per-request:
  `{{$uuid}}`, `{{$timestamp}}`, `{{$isoTimestamp}}`, `{{$randomInt}}` /
  `{{$randomInt(min,max)}}`, `{{$randomFloat}}`, `{{$randomBool}}`,
  `{{$randomString}}`, `{{$randomEmail}}`.
- Live **request log** showing every hit the mock server receives, with
  method, path, status, and duration.
- Routes can be toggled on/off individually without deleting them.

### 12. Tests & Load Testing

*(`src/features/tests/TestsModal.tsx`, `src/features/runner/RunnerModal.tsx`, `stores/runnerStore.ts`, `stores/loadTestStore.ts`, `src-tauri/src/commands/loadtest.rs`)*

Two related but distinct tools:

- **Collection Runner** (`RunnerModal.tsx`) — runs every request in a collection
  sequentially, showing pass/fail/duration per request and an overall summary.
  Reachable from a collection's context menu.
- **Tests panel** (`TestsModal.tsx`), with several test shapes:
  - **Load Test** — constant virtual users for a fixed duration.
  - **Stress Test** — ramps VUs up over time to find breaking points.
  - **Spike Test** — sudden burst of traffic, then recovery.
  - **Soak Test** — sustained load over an extended period (presets from 1m to 2h).
  - **Response Assertions** — validate status code, response time threshold,
    and body content for a single request.
  - **Chain / Sequence Test** — runs requests from a collection in order,
    passing variables between steps.

  Load/stress/spike/soak tests execute in Rust (`commands/loadtest.rs`) using
  real concurrent HTTP workers, not simulated in the webview — progress
  (VUs active, requests/sec, error rate, latency percentiles) streams back
  live via Tauri events.

### 13. Settings

*(`src/components/Settings/SettingsDrawer.tsx`, `stores/settingsStore.ts`)*

- **Appearance** — Dark / Light theme toggle, Opaque Mode (solid vs. translucent
  panel backgrounds).
- **Font Dimension Metrics** — independent font-size steppers for the Sidebar,
  Request Panel, and Response Panel.
- **Zoom Level** — independent UI scale (layout, icons, and text) per panel.
- **Preferences** — Restore Last Session, Default HTTP Method, default JSON
  formatting style (Pretty/Compact), Response Word Wrap, Confirm Before Closing
  (unsaved-tab guard).
- Panel sizes (sidebar width, request-editor height, performance-panel width)
  are independently draggable and debounce-persisted, along with every setting
  above, to the SQLite `app_settings` table so they survive a restart.

### 14. Auto-Updater

*(`src/features/updater/`)*

- Checks for new releases in the background (`useAutoUpdate.ts`) using Tauri's
  updater plugin, and shows an in-app `UpdateModal.tsx` with release notes and
  a one-click install-and-restart, instead of sending the user to a download page.

### 15. About / Dev-note modal

*(`src/features/about/AboutDevModal.tsx`)*

- Opened from the user icon at the bottom of the sidebar.
- A short note from the developer plus X/LinkedIn contact links (opened via
  the Tauri **shell** plugin so they launch the system browser, since a
  webview has no "open in new tab" chrome of its own).
- A small interactive easter egg: a draggable mask overlay on an image,
  themed for both light and dark mode.

---

## Data & storage

Everything below lives in a single SQLite database file (WAL mode, connection-
pooled via `r2d2`), versioned with SQL migrations in `src-tauri/src/db/migrations/`:

- Collections & folders (with ordering)
- Saved requests
- Request history (capped, indexed for search)
- Environments & variables
- Persisted open tabs (for session restore)
- App settings (theme, fonts, zoom, panel sizes, preferences)

No data is sent anywhere — Kairo is entirely local-first; the only outbound
network calls are the ones *you* configure (the requests you send, imports you
trigger, and update checks).

---

## Project layout

```
kairo/
├─ src/                        React + TypeScript frontend
│  ├─ components/               Sidebar, Tabs, RequestBuilder, ResponseViewer,
│  │                             PerformancePanel, Settings, common (shared modals)
│  ├─ features/                 environments/, sockets/, sse/, graphql/, mocks/,
│  │                             tests/, runner/, updater/, about/
│  ├─ stores/                   zustand stores — one per domain (tabs, settings,
│  │                             environments, collections, sockets, sse, graphql,
│  │                             mock, runner, load test)
│  ├─ lib/                      typed IPC wrapper (api.ts), codegen, graphql helpers,
│  │                             factories
│  └─ types/                    shared TS types, mirrored 1:1 by Rust structs
├─ src-tauri/                   Rust backend
│  ├─ src/commands/              tauri commands: http, ws, sse, mock, loadtest,
│  │                             scripts, storage, env, import (+ postman/openapi parsers)
│  ├─ src/storage/                SQLite access layer, one module per entity
│  ├─ src/db/migrations/          versioned SQL migrations
│  ├─ src/models/                 serde structs mirroring src/types/index.ts
│  ├─ capabilities/               Tauri permission manifests
│  └─ tauri.conf.json             window + bundle target config
└─ kairo-landing/                separate Next.js marketing site (not part of the app)
```

## Prerequisites

- Node.js 18+
- Rust (stable, via [rustup](https://rustup.rs))
- Platform build tools:
  - **Windows**: Microsoft C++ Build Tools + WebView2 (usually preinstalled on Win 10/11)
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`,
    `librsvg2-dev`, `build-essential` (Debian/Ubuntu package names)

## Setup

```bash
npm install
npm run tauri dev      # launches the app with hot reload
```

> Note: some Rust-side changes (backend defaults, new Tauri commands, new
> capability permissions) require a full restart of `tauri dev`, not just a
> frontend hot-reload — the Rust binary itself has to recompile.

## Building installers for all 3 platforms

Tauri cross-compiles best when built **on** each target OS (or via CI runners
for each OS — GitHub Actions is the common approach for a single repo that
ships to all three).

```bash
npm run tauri build
```

This produces, per OS it's run on:

| OS | Artifacts | Location |
|---|---|---|
| Windows | `.msi`, `.exe` (NSIS) | `src-tauri/target/release/bundle/{msi,nsis}` |
| macOS | `.app`, `.dmg` | `src-tauri/target/release/bundle/{macos,dmg}` |
| Linux | `.AppImage`, `.deb`, `.rpm` | `src-tauri/target/release/bundle/{appimage,deb,rpm}` |

Target list is already set in `src-tauri/tauri.conf.json` → `bundle.targets`.

## CI / automated releases

Two workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push/PR to `main`: type-checks and builds the
  frontend so broken TypeScript never reaches a release build.
- **`release.yml`** — builds **all three platforms in parallel** (Windows
  `.msi`/`.exe`, macOS `.dmg` for both Apple Silicon and Intel, Linux
  `.AppImage`/`.deb`/`.rpm`) and attaches them as a **draft GitHub Release**
  whenever you push a version tag:

  ```bash
  git tag v1.1.2
  git push --tags
  ```

  Go to your repo's **Releases** tab, review the draft, and publish it — that's
  the file you hand to Windows/macOS/Linux users, each downloading only the
  artifact for their own OS. Typical end-to-end runtime on GitHub's free
  runners is 15–25 minutes across the 4 parallel jobs. No local Windows/Mac/
  Linux machines needed — GitHub's hosted runners do the OS-specific compiling.

## Icons

Icons live in `src-tauri/icons/`. To regenerate a full multi-resolution set
from a new source image:

```bash
npm run tauri icon path/to/source-1024.png
```

## Known limitations / roadmap

- **Form-data multipart body construction** — the UI for adding fields exists
  (`FormDataTable.tsx`); the multipart encode/send path is the next increment.
- **DNS/connect/TLS phase timing breakdown** — TTFB, download, and total are
  real today; a finer-grained breakdown needs a custom `hyper` connector.
- **Drag-and-drop reordering** in the collection tree beyond folder-level
  reorder is still basic.

Every feature above was designed to be additive — new SQL migrations, new
command modules, new feature folders — without touching existing code paths,
so extending any of them shouldn't require restructuring what's already there.