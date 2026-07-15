const chainSteps = [
  { method: "POST", path: "/auth/login", status: "200", time: "85ms", ok: true, extract: "token → auth_token" },
  { method: "GET", path: "/users/me", status: "200", time: "42ms", ok: true, extract: "id → user_id" },
  { method: "PUT", path: "/users/{{user_id}}", status: "200", time: "67ms", ok: true },
  { method: "GET", path: "/users/{{user_id}}/orders", status: "200", time: "53ms", ok: true, extract: "orders[0].id → order_id" },
  { method: "DELETE", path: "/orders/{{order_id}}", status: "403", time: "12ms", ok: false },
];

export function ChainTestVisual() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-400">Chain Test</span>
          <span className="text-[10px] text-neutral-600 font-mono">Users API Flow</span>
        </div>
        <span className="text-[11px]">
          <span className="text-emerald-400">4 passed</span>
          <span className="text-neutral-600 mx-1">·</span>
          <span className="text-red-400">1 failed</span>
        </span>
      </div>
      <div className="p-4">
        {chainSteps.map((s, i) => (
          <div key={i}>
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  s.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  {s.ok ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  )}
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-neutral-200 truncate">
                    {s.method} {s.path}
                  </span>
                  <span className={`text-[10px] font-mono ${s.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {s.status}
                  </span>
                </div>
              </div>
              <span className="text-[11px] text-neutral-600 font-mono shrink-0">{s.time}</span>
            </div>
            {s.extract && (
              <div className="ml-8 mt-1 mb-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded">
                  → {s.extract}
                </span>
              </div>
            )}
            {i < chainSteps.length - 1 && <div className="ml-[9px] h-4 border-l border-white/[0.08]" />}
          </div>
        ))}
      </div>
      <div className="px-4 py-3 border-t border-white/[0.06] bg-red-500/[0.03]">
        <div className="text-[11px]">
          <span className="text-red-400 font-medium">Step 5 failed: </span>
          <span className="text-neutral-400">
            DELETE /orders/{"{{order_id}}"} returned 403 Forbidden — insufficient permissions
          </span>
        </div>
      </div>
    </div>
  );
}

const assertions = [
  { label: "Status code", op: "equals", value: "200", ok: true },
  { label: "Response time", op: "less than", value: "500ms", ok: true },
  { label: "Body JSON $.data.length", op: "greater than", value: "0", ok: true },
  { label: "Header content-type", op: "contains", value: "application/json", ok: true },
  { label: "Body JSON $.meta.total", op: "equals", value: "100", ok: false, got: "got 87" },
];

export function AssertionsVisual() {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-neutral-400">Response Assertions</span>
        <span className="text-[11px]">
          <span className="text-emerald-400">4 passed</span>
          <span className="text-neutral-600 mx-1">·</span>
          <span className="text-red-400">1 failed</span>
        </span>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.01]">
        <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
          GET
        </span>
        <span className="text-[11px] font-mono text-neutral-300 truncate">/api/v1/users?page=1&amp;limit=20</span>
        <span className="text-[10px] font-mono text-emerald-400 ml-auto shrink-0">200</span>
        <span className="text-[10px] font-mono text-neutral-500 shrink-0">142ms</span>
      </div>
      <div className="divide-y divide-white/[0.04]">
        {assertions.map((a, i) => (
          <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${!a.ok ? "bg-red-500/[0.03]" : ""}`}>
            <div
              className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                a.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                {a.ok ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                )}
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[11px] text-neutral-300">{a.label}</span>
              <span className="text-[11px] text-neutral-500 mx-1">{a.op}</span>
              <span className="text-[11px] text-orange-400 font-mono">{a.value}</span>
            </div>
            {a.got && <div className="shrink-0 text-right text-[10px] font-mono text-red-400">{a.got}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
