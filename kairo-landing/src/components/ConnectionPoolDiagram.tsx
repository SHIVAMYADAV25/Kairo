export default function ConnectionPoolDiagram() {
  return (
    <div className="glass-card rounded-xl p-4 sm:p-6 my-8 not-prose overflow-x-auto">
      <svg viewBox="0 0 900 460" className="w-full min-w-[720px]" role="img" aria-label="Cold connection versus pooled connection timing diagram">
        <title>First request pays DNS + TCP + TLS setup cost; every request after reuses a pooled client and skips straight to sending data</title>
        <defs>
          <marker id="arrow2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#78716c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* ===== Row 1: cold request ===== */}
        <text x="40" y="34" fontSize="13" fontWeight="600" fill="#f5f5f4">
          Request #1 to api.example.com
        </text>
        <text x="40" y="52" fontSize="10.5" fill="#a3a3a3">
          build_client(&amp;request) — nothing to reuse yet
        </text>

        <g>
          <rect x="40" y="66" width="130" height="44" rx="8" fill="#f871711a" stroke="#f8717140" />
          <text x="105" y="86" fontSize="11" fontWeight="600" fill="#fca5a5" textAnchor="middle">DNS lookup</text>
          <text x="105" y="101" fontSize="9.5" fill="#a8a29e" textAnchor="middle">~40ms</text>

          <rect x="176" y="66" width="110" height="44" rx="8" fill="#f871711a" stroke="#f8717140" />
          <text x="231" y="86" fontSize="11" fontWeight="600" fill="#fca5a5" textAnchor="middle">TCP handshake</text>
          <text x="231" y="101" fontSize="9.5" fill="#a8a29e" textAnchor="middle">~30ms</text>

          <rect x="292" y="66" width="150" height="44" rx="8" fill="#f871711a" stroke="#f8717140" />
          <text x="367" y="86" fontSize="11" fontWeight="600" fill="#fca5a5" textAnchor="middle">TLS handshake</text>
          <text x="367" y="101" fontSize="9.5" fill="#a8a29e" textAnchor="middle">~60ms</text>

          <rect x="448" y="66" width="140" height="44" rx="8" fill="#fb923c1a" stroke="#fb923c40" />
          <text x="518" y="86" fontSize="11" fontWeight="600" fill="#fdba74" textAnchor="middle">your request</text>
          <text x="518" y="101" fontSize="9.5" fill="#a8a29e" textAnchor="middle">~20ms</text>
        </g>
        <text x="606" y="93" fontSize="12.5" fontWeight="700" fill="#fca5a5">≈150ms total</text>
        <text x="606" y="108" fontSize="9.5" fill="#78716c">— mostly setup, not your data</text>

        {/* connection kept open note */}
        <line x1="518" y1="110" x2="518" y2="150" stroke="#78716c" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow2)" />
        <text x="530" y="140" fontSize="10" fill="#a8a29e">Client — and its open</text>
        <text x="530" y="153" fontSize="10" fill="#a8a29e">connection — is kept, not dropped</text>

        {/* ===== ClientPool box ===== */}
        <rect x="40" y="164" width="820" height="60" rx="10" fill="#ffffff05" stroke="#ffffff1f" strokeDasharray="4 3" />
        <text x="450" y="188" fontSize="12.5" fontWeight="600" fill="#e7e5e4" textAnchor="middle">
          ClientPool — HashMap&lt;settings, Arc&lt;Client&gt;&gt;
        </text>
        <text x="450" y="207" fontSize="10.5" fill="#a8a29e" textAnchor="middle">
          same timeout / redirects / SSL settings as last time? → hand back the same warm client, DNS cache and all
        </text>

        <line x1="450" y1="110" x2="450" y2="164" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow2)" />
        <line x1="450" y1="224" x2="450" y2="258" stroke="#78716c" strokeWidth="1.5" markerEnd="url(#arrow2)" />

        {/* ===== Row 2: warm request ===== */}
        <text x="40" y="278" fontSize="13" fontWeight="600" fill="#f5f5f4">
          Request #2, #3, #4… to the same API
        </text>
        <text x="40" y="296" fontSize="10.5" fill="#a3a3a3">
          client_pool.get_or_build(&amp;request) — already in the map
        </text>

        <g>
          <rect x="40" y="310" width="130" height="44" rx="8" fill="#ffffff05" stroke="#ffffff14" />
          <text x="105" y="328" fontSize="10" fill="#78716c" textAnchor="middle" textDecoration="line-through">DNS lookup</text>
          <text x="105" y="343" fontSize="9" fill="#57534e" textAnchor="middle">skipped</text>

          <rect x="176" y="310" width="110" height="44" rx="8" fill="#ffffff05" stroke="#ffffff14" />
          <text x="231" y="328" fontSize="10" fill="#78716c" textAnchor="middle" textDecoration="line-through">TCP handshake</text>
          <text x="231" y="343" fontSize="9" fill="#57534e" textAnchor="middle">skipped</text>

          <rect x="292" y="310" width="150" height="44" rx="8" fill="#ffffff05" stroke="#ffffff14" />
          <text x="367" y="328" fontSize="10" fill="#78716c" textAnchor="middle" textDecoration="line-through">TLS handshake</text>
          <text x="367" y="343" fontSize="9" fill="#57534e" textAnchor="middle">skipped</text>

          <rect x="448" y="310" width="140" height="44" rx="8" fill="#34d3991a" stroke="#34d39940" />
          <text x="518" y="328" fontSize="11" fontWeight="600" fill="#6ee7b7" textAnchor="middle">your request</text>
          <text x="518" y="343" fontSize="9.5" fill="#a8a29e" textAnchor="middle">~20ms</text>
        </g>
        <text x="606" y="337" fontSize="12.5" fontWeight="700" fill="#6ee7b7">≈20ms total</text>
        <text x="606" y="352" fontSize="9.5" fill="#78716c">— basically just your data now</text>

        {/* footer takeaway */}
        <rect x="40" y="384" width="820" height="52" rx="10" fill="#fb923c0d" stroke="#fb923c26" />
        <text x="450" y="406" fontSize="12" fontWeight="600" fill="#fdba74" textAnchor="middle">
          ~7-8× faster on repeat requests to the same host
        </text>
        <text x="450" y="423" fontSize="10" fill="#a8a29e" textAnchor="middle">
          not from a clever algorithm — from not throwing away expensive setup work between clicks
        </text>
      </svg>
    </div>
  );
}