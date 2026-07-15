const stack = [
  {
    layer: "App shell",
    pick: "Tauri 2 (Rust)",
    why: "A native binary instead of shipping Chromium. The OS's own WebView renders the UI, so the app starts in under 2 seconds and idles under 80MB — that's not achievable with Electron.",
  },
  {
    layer: "UI layer",
    pick: "React + TypeScript + Vite",
    why: "Nothing exotic. Vite gives instant HMR against the Tauri dev server, TypeScript keeps the IPC payloads honest on both sides of the bridge.",
  },
  {
    layer: "State",
    pick: "Zustand, one store per feature",
    why: "socketStore, sseStore, environmentStore, tabStore… small independent stores instead of one giant global one. A WebSocket reconnect doesn't re-render your request tabs.",
  },
  {
    layer: "HTTP client",
    pick: "reqwest + rustls",
    why: "rustls means no OpenSSL system dependency to fight with across macOS / Windows / Linux builds. hyper underneath for HTTP/1.1 and HTTP/2.",
  },
  {
    layer: "Storage",
    pick: "SQLite via rusqlite + r2d2",
    why: "A pooled connection (not a single Mutex<Connection>) so a history search doesn't block a request that's mid-flight. WAL mode lets reads and writes coexist.",
  },
  {
    layer: "Scripting",
    pick: "rquickjs (embedded QuickJS)",
    why: "Pre-request / test scripts need a real JS engine, but bundling Node.js just for that is a lot of dead weight. QuickJS compiles into the binary and starts in microseconds.",
  },
  {
    layer: "Realtime",
    pick: "tokio-tungstenite + SSE + axum",
    why: "WebSocket and SSE connections are long-lived, so they don't fit the request/response invoke() model — they push events with app.emit() instead. axum runs the embedded mock server.",
  },
  {
    layer: "Editor",
    pick: "Monaco",
    why: "The same editor VS Code uses, for body/script editing with real syntax highlighting instead of a plain textarea.",
  },
];

export default function BuildYourOwnChecklist() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 not-prose">
      {stack.map((s) => (
        <div key={s.layer} className="glass-card rounded-xl p-5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-400">
            {s.layer}
          </span>
          <h4 className="text-white font-semibold mt-1 mb-2">{s.pick}</h4>
          <p className="text-sm text-neutral-400 leading-relaxed">{s.why}</p>
        </div>
      ))}
    </div>
  );
}
