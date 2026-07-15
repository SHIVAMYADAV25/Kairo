export function RequestBuilderVisual() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
        <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1.5 rounded">
          GET
        </span>
        <div className="flex-1 bg-white/[0.03] rounded px-3 py-1.5 font-mono text-sm text-neutral-300">
          <span className="text-amber-400">{"{{base_url}}"}</span>
          /api/v1/users<span className="text-neutral-600">?page=1&amp;limit=20</span>
        </div>
      </div>
      <div className="flex border-b border-white/[0.06] text-xs">
        {["Params", "Headers", "Body", "Auth", "Scripts"].map((t) => (
          <button
            key={t}
            className={`px-4 py-2.5 border-b-2 ${
              t === "Body" ? "border-orange-500 text-white" : "border-transparent text-neutral-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed">
        <div className="text-neutral-600">// JSON body</div>
        <div><span className="syn-operator">{"{"}</span></div>
        <div className="pl-4"><span className="syn-property">&quot;name&quot;</span><span className="syn-operator">: </span><span className="syn-string">&quot;John Doe&quot;</span><span className="syn-operator">,</span></div>
        <div className="pl-4"><span className="syn-property">&quot;email&quot;</span><span className="syn-operator">: </span><span className="syn-string">&quot;john@example.com&quot;</span><span className="syn-operator">,</span></div>
        <div className="pl-4"><span className="syn-property">&quot;role&quot;</span><span className="syn-operator">: </span><span className="syn-string">&quot;admin&quot;</span></div>
        <div><span className="syn-operator">{"}"}</span></div>
      </div>
    </div>
  );
}

export function ScriptingVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-xs text-neutral-500 font-medium">Pre-request Script</span>
        </div>
        <div className="p-4 font-mono text-xs leading-relaxed">
          <div><span className="syn-comment">// Generate auth token before each request</span></div>
          <div><span className="syn-keyword">const </span><span className="syn-variable">timestamp</span><span className="syn-operator"> = </span><span className="syn-function">Date</span><span className="syn-operator">.</span><span className="syn-function">now</span><span className="syn-operator">();</span></div>
          <div><span className="syn-keyword">const </span><span className="syn-variable">secret</span><span className="syn-operator"> = </span><span className="syn-variable">kr</span><span className="syn-operator">.</span><span className="syn-function">env</span><span className="syn-operator">.</span><span className="syn-function">get</span><span className="syn-operator">(</span><span className="syn-string">&quot;API_SECRET&quot;</span><span className="syn-operator">);</span></div>
          <div>&nbsp;</div>
          <div><span className="syn-keyword">const </span><span className="syn-variable">token</span><span className="syn-operator"> = </span><span className="syn-keyword">await </span><span className="syn-variable">kr</span><span className="syn-operator">.</span><span className="syn-function">hmac</span><span className="syn-operator">(</span><span className="syn-string">&quot;sha256&quot;</span><span className="syn-operator">, </span><span className="syn-variable">secret</span><span className="syn-operator">, </span><span className="syn-variable">timestamp</span><span className="syn-operator">);</span></div>
          <div>&nbsp;</div>
          <div><span className="syn-variable">kr</span><span className="syn-operator">.</span><span className="syn-function">env</span><span className="syn-operator">.</span><span className="syn-function">set</span><span className="syn-operator">(</span><span className="syn-string">&quot;auth_token&quot;</span><span className="syn-operator">, </span><span className="syn-variable">token</span><span className="syn-operator">);</span></div>
          <div><span className="syn-variable">kr</span><span className="syn-operator">.</span><span className="syn-function">console</span><span className="syn-operator">.</span><span className="syn-function">log</span><span className="syn-operator">(</span><span className="syn-string">&quot;Token generated&quot;</span><span className="syn-operator">, </span><span className="syn-variable">token</span><span className="syn-operator">);</span></div>
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-xs text-neutral-500 font-medium">Console</span>
        </div>
        <div className="p-4 font-mono text-xs">
          <div className="text-emerald-400"><span className="text-neutral-600 mr-2">[pre]</span>Token generated a3f8b2c1...</div>
          <div className="text-orange-400"><span className="text-neutral-600 mr-2">[env]</span>auth_token updated</div>
        </div>
      </div>
    </div>
  );
}

const runnerRows = [
  { icon: "✓", iconColor: "text-emerald-400", method: "GET", methodColor: "text-emerald-400", name: "List Users", status: "200", statusColor: "text-emerald-400", time: "120ms" },
  { icon: "✓", iconColor: "text-emerald-400", method: "POST", methodColor: "text-amber-400", name: "Create User", status: "201", statusColor: "text-emerald-400", time: "85ms" },
  { icon: "✗", iconColor: "text-red-400", method: "GET", methodColor: "text-emerald-400", name: "Get User", status: "404", statusColor: "text-red-400", time: "45ms" },
  { icon: "⟳", iconColor: "text-orange-400", method: "PUT", methodColor: "text-orange-400", name: "Update User", status: "...", statusColor: "text-neutral-600", time: "", highlight: true },
  { icon: "○", iconColor: "text-neutral-600", method: "DELETE", methodColor: "text-red-400", name: "Delete User", status: "—", statusColor: "text-neutral-600", time: "" },
  { icon: "○", iconColor: "text-neutral-600", method: "GET", methodColor: "text-emerald-400", name: "List Settings", status: "—", statusColor: "text-neutral-600", time: "" },
];

export function RunnerVisual() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-neutral-400">Collection Runner</span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider">
          New
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex-1 bg-white/[0.03] rounded px-3 py-1.5 text-xs text-neutral-300">Users API</div>
        <button className="px-3 py-1.5 rounded text-xs font-medium bg-red-500/20 text-red-400">■ Stop</button>
      </div>
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5">
          <span>Progress: 3/6</span>
          <span>
            <span className="text-emerald-400">2 passed</span>
            <span className="text-red-400 ml-2">1 failed</span>
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-red-500" style={{ width: "50%" }} />
        </div>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {runnerRows.map((r, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2 text-xs ${r.highlight ? "bg-orange-500/[0.03]" : ""}`}>
            <span className={`w-4 text-center font-bold ${r.iconColor}`}>{r.icon}</span>
            <span className={`font-bold w-12 ${r.methodColor}`}>{r.method}</span>
            <span className="text-neutral-300 flex-1 truncate">{r.name}</span>
            <span className={`font-mono ${r.statusColor}`}>{r.status}</span>
            <span className="text-neutral-600 w-12 text-right">{r.time || "—"}</span>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-white/[0.06] text-[11px] text-neutral-500">
        Summary: 3/6 complete · <span className="text-emerald-400">2 passed</span> ·{" "}
        <span className="text-red-400">1 failed</span>
      </div>
    </div>
  );
}

export function CollaborationVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-neutral-400">Workspace</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider">
            Synced
          </span>
        </div>
        <div className="p-3 space-y-1.5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-orange-500/20 text-orange-400">
              A
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-200 font-medium">Acme Corp</div>
              <div className="text-[10px] text-neutral-500">8 members · Owner</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03]">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-white/[0.05] text-neutral-500">
              P
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-neutral-200 font-medium">Personal</div>
              <div className="text-[10px] text-neutral-500">1 members · Owner</div>
            </div>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Public Collection</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">
            Shareable
          </span>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 bg-white/[0.03] rounded px-3 py-2">
            <span className="text-[11px] font-mono text-neutral-300 truncate">kairoapp.dev/c/acme-users-api</span>
            <button className="text-[10px] px-2 py-0.5 rounded bg-orange-500/15 text-orange-400 font-medium shrink-0 ml-auto">
              Copy
            </button>
          </div>
          <p className="text-[10px] text-neutral-600 mt-2 px-1">
            Anyone with the link can import this collection into their Kairo.
          </p>
        </div>
      </div>
    </div>
  );
}

const endpoints = [
  { method: "GET", color: "text-emerald-400", path: "/users", tag: "Users" },
  { method: "POST", color: "text-amber-400", path: "/users", tag: "Users" },
  { method: "GET", color: "text-emerald-400", path: "/users/{id}", tag: "Users" },
  { method: "POST", color: "text-amber-400", path: "/auth/login", tag: "Auth" },
  { method: "POST", color: "text-amber-400", path: "/auth/refresh", tag: "Auth" },
];

export function OpenApiVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-xs text-neutral-500 font-medium">Import OpenAPI Spec</span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 bg-white/[0.03] rounded px-3 py-2 mb-3">
            <span className="text-[11px] font-mono text-neutral-300 truncate">https://api.example.com/openapi.json</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-[10px] px-3 py-1.5 rounded font-medium bg-orange-500/15 text-orange-400">
              From URL
            </button>
            <button className="text-[10px] px-3 py-1.5 rounded font-medium bg-white/[0.04] text-neutral-500">
              From File
            </button>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Preview</span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">
            OpenAPI 3.1
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Acme Users API</div>
              <div className="text-[10px] text-neutral-500">v2.1.0 · 24 endpoints · 4 tags</div>
            </div>
          </div>
          <div className="space-y-1.5">
            {endpoints.map((e, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <span className={`font-mono font-semibold w-10 ${e.color}`}>{e.method}</span>
                <span className="font-mono text-neutral-300 flex-1 truncate">{e.path}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-neutral-500">{e.tag}</span>
              </div>
            ))}
            <div className="text-[10px] text-neutral-600 pt-1">+ 19 more endpoints...</div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.06]">
          <button className="w-full text-[11px] font-medium px-4 py-2 rounded-lg bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 transition-colors">
            Import 24 endpoints into &quot;Acme Users API&quot;
          </button>
        </div>
      </div>
    </div>
  );
}
