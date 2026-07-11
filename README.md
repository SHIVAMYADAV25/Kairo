# RequestKit

A fast, lightweight, cross-platform API client (Postman-class) built with
**React + TypeScript** on the frontend and **Rust + Tauri** on the backend.

## Why this stack is fast

- **Tauri, not Electron.** Tauri uses the OS's native webview (WebView2 on
  Windows, WKWebView on macOS, WebKitGTK on Linux) instead of bundling an
  entire Chromium runtime. Result: a multi-MB installer instead of 100MB+,
  and tens of MB of idle RAM instead of 150MB+.
- **All heavy lifting happens in Rust**, not the webview's JS thread:
  - HTTP execution via `reqwest`/`hyper` with real phase timing (TTFB,
    download) — not a browser `fetch()`, which can't expose this and is
    also blocked by CORS for arbitrary APIs.
  - SQLite (via `rusqlite` + `r2d2` pooling, WAL mode) for collections,
    requests, history, environments, and settings — scales to tens of
    thousands of history rows with indexed lookups, unlike `localStorage`.
  - Pre-request/test scripts run in an embedded QuickJS sandbox
    (`rquickjs`) — no bundled Node.js runtime required.
- **React is fine here** because the IPC boundary means most re-renders are
  local to a panel (Params table, response tree, performance gauge) — one
  `invoke()` per Send, not chatty round trips.
- **Release profile tuned for size/startup**: LTO, single codegen unit,
  `opt-level = "z"`, stripped symbols (see `src-tauri/Cargo.toml`).

## Project layout

```
requestkit/
├─ src/                      React + TypeScript frontend
│  ├─ components/            Sidebar, Tabs, RequestBuilder, ResponseViewer, PerformancePanel, Settings
│  ├─ features/               environments/, (sockets/ mocks/ tests/ import/ reserved for growth)
│  ├─ stores/                 zustand stores (tabs, settings, environments)
│  ├─ lib/                    typed IPC wrapper (api.ts) + factories
│  └─ types/                  shared TS types, mirrored 1:1 by Rust structs
├─ src-tauri/                 Rust backend
│  ├─ src/commands/           tauri commands: http, storage, scripts, env, import
│  ├─ src/storage/            SQLite access layer, one module per entity
│  ├─ src/db/migrations/      versioned SQL migrations
│  ├─ src/models/             serde structs mirroring src/types/index.ts
│  └─ tauri.conf.json         window + bundle target config
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

### CI / automated releases (already set up)

Two workflows live in `.github/workflows/`:

- **`ci.yml`** — runs on every push/PR to `main`: type-checks and builds the
  frontend so broken TypeScript never reaches a release build.
- **`release.yml`** — builds **all three platforms in parallel** (Windows
  `.msi`/`.exe`, macOS `.dmg` for both Apple Silicon and Intel, Linux
  `.AppImage`/`.deb`/`.rpm`) and attaches them as a **draft GitHub Release**
  whenever you push a version tag:

  ```bash
  git tag v0.1.0
  git push --tags
  ```

  Go to your repo's **Releases** tab, review the draft, and publish it —
  that's the file you hand to Windows/macOS/Linux users, each downloading
  only the artifact for their own OS. Typical end-to-end runtime on
  GitHub's free runners is 15–25 minutes across the 4 parallel jobs.

  No local Windows/Mac/Linux machines needed — GitHub's hosted runners do
  the OS-specific compiling for you.

## Icons

Placeholder icons are in `src-tauri/icons/`. Before a real release, regenerate
them from a source PNG with:

```bash
npm run tauri icon path/to/source-1024.png
```

This produces a proper multi-resolution `.icns` for macOS (the current one is
a stand-in single-resolution PNG renamed — fine for `dev`, **not** for a real
macOS bundle).

## What's implemented vs. scaffolded

**Implemented (real logic, not stubs):**
- Full 4-pane UI matching the reference screenshots (icon rail, sidebar,
  tabs, request builder with Params/Headers/Body/Auth/Scripts/Settings,
  response viewer with Tree/Raw/Headers/Cookies/Tests/Preview, performance
  panel with circular gauge + bar history)
- Rust HTTP execution with TTFB/download/total timing, redirects, timeout,
  SSL toggle, auth (Bearer/Basic/API Key), JSON/raw/url-encoded bodies
- SQLite storage for collections, requests, history (capped + indexed),
  environments, settings — all wired through a typed `api.ts`
- Environment variable substitution (`{{VAR}}`) done in Rust
- Sandboxed pre-request/test script execution via QuickJS
- Resizable panels + adjustable font sizes, debounced-persisted
  (sidebar width, request-editor height, **and** response-viewer height are
  all independently draggable and persisted)
- Settings drawer (theme, opaque mode, font sizes)
- Environments modal (two-pane list + editor, matches the reference
  screenshot) reachable from the top-right environment selector or the
  sidebar Environments panel
- CI (`ci.yml`) + automated multi-platform release builds (`release.yml`)
  triggered by pushing a `v*` tag

**Scaffolded / next slice (structure is in place, logic is a TODO):**
- Postman/OpenAPI collection parsing on import (currently creates the
  collection shell; walking `item`/`paths` to populate requests is the next
  increment — see `commands/import.rs`)
- Form-data multipart body construction
- DNS/connect/TLS phase timing breakdown (needs a custom `hyper` connector;
  TTFB/download/total are real today)
- Sockets, Mocks, Runner/Tests panels (sidebar entries + DB tables reserved,
  UI shows "coming soon")
- Drag-and-drop reordering in the collection tree

Every one of these was designed to be additive — new SQL migrations, new
command modules, new feature folders — without touching existing code paths.
