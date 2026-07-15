export default function ArchitectureDiagram() {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 my-8 not-prose overflow-x-auto">
      <svg viewBox="0 0 900 620" className="w-full min-w-[720px]" role="img" aria-label="Kairo architecture diagram">
        <title>Kairo architecture: React UI talks to a Rust core over Tauri IPC</title>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* Webview / frontend */}
        <rect x="40" y="30" width="820" height="120" rx="12" fill="#ffffff08" stroke="#ffffff14" />
        <text x="64" y="58" fontSize="14" fontWeight="600" fill="#f5f5f4">
          WebView — React + TypeScript
        </text>
        <text x="64" y="76" fontSize="11" fill="#a3a3a3">
          Everything the user sees. No business logic lives here.
        </text>
        {[
          { label: "Request Builder", x: 64 },
          { label: "Zustand stores", x: 254 },
          { label: "Monaco editor", x: 444 },
          { label: "Recharts (perf panel)", x: 634 },
        ].map((b) => (
          <g key={b.label}>
            <rect x={b.x} y="92" width="170" height="40" rx="8" fill="#fb923c1a" stroke="#fb923c33" />
            <text x={b.x + 85} y="117" fontSize="11.5" fill="#fdba74" textAnchor="middle">
              {b.label}
            </text>
          </g>
        ))}

        {/* IPC bridge */}
        <line x1="450" y1="150" x2="450" y2="196" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="410" y1="196" x2="410" y2="150" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <rect x="150" y="196" width="600" height="56" rx="10" fill="#ffffff05" stroke="#ffffff1f" strokeDasharray="4 3" />
        <text x="450" y="219" fontSize="12.5" fontWeight="600" fill="#e7e5e4" textAnchor="middle">
          Tauri IPC bridge
        </text>
        <text x="450" y="238" fontSize="10.5" fill="#a8a29e" textAnchor="middle">
          invoke(&quot;execute_request&quot;, payload) → Promise · app.emit(&quot;ws-message&quot;, …) → listen()
        </text>

        {/* Rust core */}
        <line x1="450" y1="252" x2="450" y2="284" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <rect x="40" y="284" width="820" height="220" rx="12" fill="#ffffff08" stroke="#ffffff14" />
        <text x="64" y="312" fontSize="14" fontWeight="600" fill="#f5f5f4">
          Rust core (src-tauri)
        </text>
        <text x="64" y="330" fontSize="11" fill="#a3a3a3">
          One native binary. No Node.js, no Chromium runtime, no separate server process.
        </text>

        {/* sub modules */}
        <g>
          <rect x="64" y="350" width="180" height="130" rx="10" fill="#fb923c14" stroke="#fb923c33" />
          <text x="154" y="374" fontSize="12" fontWeight="600" fill="#fdba74" textAnchor="middle">HTTP engine</text>
          <text x="154" y="392" fontSize="10" fill="#d6d3d1" textAnchor="middle">reqwest + rustls</text>
          <text x="154" y="408" fontSize="10" fill="#d6d3d1" textAnchor="middle">hyper (h1 / h2)</text>
          <text x="154" y="424" fontSize="10" fill="#d6d3d1" textAnchor="middle">builds + sends</text>
          <text x="154" y="440" fontSize="10" fill="#d6d3d1" textAnchor="middle">the actual request</text>
          <text x="154" y="462" fontSize="9.5" fill="#a8a29e" textAnchor="middle">execute_request()</text>
        </g>

        <g>
          <rect x="264" y="350" width="180" height="130" rx="10" fill="#34d3991a" stroke="#34d39933" />
          <text x="354" y="374" fontSize="12" fontWeight="600" fill="#6ee7b7" textAnchor="middle">Storage</text>
          <text x="354" y="392" fontSize="10" fill="#d6d3d1" textAnchor="middle">rusqlite + r2d2</text>
          <text x="354" y="408" fontSize="10" fill="#d6d3d1" textAnchor="middle">pool, max 8 conns</text>
          <text x="354" y="424" fontSize="10" fill="#d6d3d1" textAnchor="middle">WAL journal mode</text>
          <text x="354" y="440" fontSize="10" fill="#d6d3d1" textAnchor="middle">collections, history,</text>
          <text x="354" y="462" fontSize="9.5" fill="#a8a29e" textAnchor="middle">envs, settings, tabs</text>
        </g>

        <g>
          <rect x="464" y="350" width="180" height="130" rx="10" fill="#c084fc1a" stroke="#c084fc33" />
          <text x="554" y="374" fontSize="12" fontWeight="600" fill="#d8b4fe" textAnchor="middle">Script sandbox</text>
          <text x="554" y="392" fontSize="10" fill="#d6d3d1" textAnchor="middle">rquickjs (QuickJS)</text>
          <text x="554" y="408" fontSize="10" fill="#d6d3d1" textAnchor="middle">embedded in-process</text>
          <text x="554" y="424" fontSize="10" fill="#d6d3d1" textAnchor="middle">no Node.js runtime</text>
          <text x="554" y="440" fontSize="10" fill="#d6d3d1" textAnchor="middle">exposes pm.environment</text>
          <text x="554" y="462" fontSize="9.5" fill="#a8a29e" textAnchor="middle">run_pre_request_script()</text>
        </g>

        <g>
          <rect x="664" y="350" width="196" height="130" rx="10" fill="#22d3ee1a" stroke="#22d3ee33" />
          <text x="762" y="374" fontSize="12" fontWeight="600" fill="#67e8f9" textAnchor="middle">Realtime engine</text>
          <text x="762" y="392" fontSize="10" fill="#d6d3d1" textAnchor="middle">tokio-tungstenite (WS)</text>
          <text x="762" y="408" fontSize="10" fill="#d6d3d1" textAnchor="middle">streamed SSE reader</text>
          <text x="762" y="424" fontSize="10" fill="#d6d3d1" textAnchor="middle">axum (mock server)</text>
          <text x="762" y="440" fontSize="10" fill="#d6d3d1" textAnchor="middle">pushes events over</text>
          <text x="762" y="462" fontSize="9.5" fill="#a8a29e" textAnchor="middle">app.emit(), not invoke()</text>
        </g>

        {/* external systems */}
        <line x1="154" y1="480" x2="154" y2="530" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="762" y1="480" x2="762" y2="530" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow)" />
        <line x1="354" y1="480" x2="354" y2="530" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow)" />

        <rect x="64" y="536" width="180" height="46" rx="8" fill="#ffffff05" stroke="#ffffff14" strokeDasharray="3 3" />
        <text x="154" y="564" fontSize="11" fill="#a8a29e" textAnchor="middle">any API on the internet</text>

        <rect x="264" y="536" width="180" height="46" rx="8" fill="#ffffff05" stroke="#ffffff14" strokeDasharray="3 3" />
        <text x="354" y="558" fontSize="11" fill="#a8a29e" textAnchor="middle">kairo.db</text>
        <text x="354" y="572" fontSize="9.5" fill="#78716c" textAnchor="middle">local SQLite file</text>

        <rect x="664" y="536" width="196" height="46" rx="8" fill="#ffffff05" stroke="#ffffff14" strokeDasharray="3 3" />
        <text x="762" y="558" fontSize="11" fill="#a8a29e" textAnchor="middle">WS / SSE peers,</text>
        <text x="762" y="572" fontSize="9.5" fill="#78716c" textAnchor="middle">local mock listener</text>
      </svg>
    </div>
  );
}
