const wsMessages = [
  { dir: "up", text: '{"action":"subscribe","channel":"trades"}', time: "12:04:01.123" },
  { dir: "down", text: '{"status":"subscribed","channel":"trades"}', time: "12:04:01.187" },
  { dir: "down", text: '{"type":"trade","price":42851.20,"qty":0.15}', time: "12:04:02.401" },
  { dir: "down", text: '{"type":"trade","price":42853.00,"qty":0.73}', time: "12:04:03.019" },
  { dir: "up", text: '{"action":"ping"}', time: "12:04:05.000" },
  { dir: "down", text: '{"action":"pong"}', time: "12:04:05.003" },
];

export function WebSocketVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-medium text-purple-400 bg-purple-400/10 px-1.5 py-0.5 rounded">
            WS
          </span>
          <div className="flex-1 bg-white/[0.03] rounded px-3 py-1.5 font-mono text-sm text-neutral-300 truncate">
            wss://stream.kairoapp.dev/v1/ws
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Connected
          </span>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
          <div className="bg-neutral-950 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Messages</div>
            <div className="text-sm font-bold text-purple-400">142</div>
          </div>
          <div className="bg-neutral-950 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Latency</div>
            <div className="text-sm font-bold text-emerald-400">3ms</div>
          </div>
          <div className="bg-neutral-950 px-3 py-2 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Uptime</div>
            <div className="text-sm font-bold text-amber-400">14m 32s</div>
          </div>
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Message Log</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-medium">2 sent</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">4 received</span>
          </div>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {wsMessages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-2 text-[11px] ${m.dir === "up" ? "bg-purple-500/[0.03]" : ""}`}>
              <span className={`shrink-0 mt-0.5 font-mono font-semibold ${m.dir === "up" ? "text-purple-400" : "text-emerald-400"}`}>
                {m.dir === "up" ? "↑" : "↓"}
              </span>
              <span className="flex-1 font-mono text-neutral-300 break-all">{m.text}</span>
              <span className="shrink-0 font-mono text-neutral-600">{m.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const sseEvents = [
  { type: "message", color: "text-orange-400", bg: "bg-orange-500/10", id: "evt_001", ago: "3s ago", body: '{"user":"alice","action":"deploy","env":"prod"}' },
  { type: "heartbeat", color: "text-neutral-400", bg: "bg-neutral-500/10", id: "evt_002", ago: "2s ago", body: '{"ts":1710600000}' },
  { type: "alert", color: "text-red-400", bg: "bg-red-500/10", id: "evt_003", ago: "1s ago", body: '{"level":"warn","msg":"CPU usage 87%","host":"web-03"}' },
  { type: "message", color: "text-orange-400", bg: "bg-orange-500/10", id: "evt_004", ago: "just now", body: '{"user":"bob","action":"rollback","env":"prod"}' },
];

export function SseVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-4 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-medium text-orange-400 bg-orange-400/10 px-1.5 py-0.5 rounded">
            SSE
          </span>
          <div className="flex-1 bg-white/[0.03] rounded px-3 py-1.5 font-mono text-sm text-neutral-300 truncate">
            https://api.kairoapp.dev/events/stream
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Streaming
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[10px] text-neutral-500">Filter:</span>
          <button className="text-[10px] px-2 py-0.5 rounded font-medium bg-orange-500/15 text-orange-400">All</button>
          <button className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/[0.04] text-neutral-500">message</button>
          <button className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/[0.04] text-neutral-500">alert</button>
          <button className="text-[10px] px-2 py-0.5 rounded font-medium bg-white/[0.04] text-neutral-500">heartbeat</button>
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Event Stream</span>
          <span className="text-[10px] text-neutral-600 font-mono">4 events</span>
        </div>
        <div className="divide-y divide-white/[0.03]">
          {sseEvents.map((e, i) => (
            <div key={i} className="px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${e.bg} ${e.color}`}>
                  {e.type}
                </span>
                <span className="text-[10px] font-mono text-neutral-600">{e.id}</span>
                <span className="text-[10px] text-neutral-600 ml-auto">{e.ago}</span>
              </div>
              <div className="font-mono text-[11px] text-neutral-300 break-all">{e.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GraphQlVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-medium text-pink-400 bg-pink-400/10 px-1.5 py-0.5 rounded">
            GQL
          </span>
          <span className="text-xs text-neutral-500 font-medium">Query Editor</span>
          <button className="ml-auto text-[10px] px-2 py-0.5 rounded font-medium bg-pink-500/15 text-pink-400">
            Run Query
          </button>
        </div>
        <div className="p-4 font-mono text-xs leading-relaxed">
          <div>
            <span className="text-pink-400">query</span> <span className="text-blue-400">GetUser</span>
            <span className="text-neutral-400">(</span>
            <span className="text-orange-400">$id</span>
            <span className="text-neutral-400">:</span> <span className="text-emerald-400">ID!</span>
            <span className="text-neutral-400">) {"{"}</span>
          </div>
          <div className="pl-4">
            <span className="text-blue-300">user</span>
            <span className="text-neutral-400">(</span>
            <span className="text-orange-400">id</span>
            <span className="text-neutral-400">:</span> <span className="text-orange-400">$id</span>
            <span className="text-neutral-400">) {"{"}</span>
          </div>
          <div className="pl-8"><span className="text-cyan-300">name</span></div>
          <div className="pl-8"><span className="text-cyan-300">email</span></div>
          <div className="pl-8"><span className="text-cyan-300">role</span></div>
          <div className="pl-4"><span className="text-neutral-400">{"}"}</span></div>
          <div><span className="text-neutral-400">{"}"}</span></div>
        </div>
      </div>
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Schema Explorer</span>
          <span className="text-[10px] text-neutral-600 font-mono">3 types</span>
        </div>
        <div className="p-3 space-y-1">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.03]">
            <span className="text-[11px] font-semibold text-pink-400">Query</span>
            <span className="text-[10px] text-neutral-600">3 fields</span>
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-white/[0.03]">
            <span className="text-[11px] font-semibold text-pink-400">User</span>
            <span className="text-[10px] text-neutral-600">5 fields</span>
          </div>
          <div className="ml-7 space-y-0.5">
            <div className="text-[10px] font-mono text-neutral-400 py-0.5">id: ID!</div>
            <div className="text-[10px] font-mono text-neutral-400 py-0.5">name: String!</div>
            <div className="text-[10px] font-mono text-neutral-400 py-0.5">email: String!</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GrpcVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-medium text-teal-400 bg-teal-400/10 px-1.5 py-0.5 rounded">
            gRPC
          </span>
          <span className="text-xs text-neutral-500 font-medium">Service Definition</span>
        </div>
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-300 font-mono">user_service.proto</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium ml-auto">
              Loaded
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/[0.04]">
          <div className="bg-neutral-950 px-4 py-3">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Service</div>
            <div className="bg-white/[0.03] rounded px-2.5 py-1.5 text-xs font-mono text-teal-400">UserService</div>
          </div>
          <div className="bg-neutral-950 px-4 py-3">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">Method</div>
            <div className="bg-white/[0.03] rounded px-2.5 py-1.5 text-xs font-mono text-teal-400">GetUser</div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Request</span>
          </div>
          <div className="p-3 font-mono text-[11px] leading-relaxed">
            <div><span className="text-neutral-400">{"{"}</span></div>
            <div className="pl-3">
              <span className="text-teal-300">&quot;user_id&quot;</span>
              <span className="text-neutral-400">: </span>
              <span className="text-amber-400">&quot;usr_29a1k&quot;</span>
            </div>
            <div><span className="text-neutral-400">{"}"}</span></div>
          </div>
        </div>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
            <span className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">Response</span>
            <span className="text-[10px] text-emerald-400 font-mono">OK · 12ms</span>
          </div>
          <div className="p-3 font-mono text-[11px] leading-relaxed">
            <div><span className="text-neutral-400">{"{"}</span></div>
            <div className="pl-3"><span className="text-teal-300">&quot;name&quot;</span><span className="text-neutral-400">: </span><span className="text-amber-400">&quot;Alice&quot;</span><span className="text-neutral-400">,</span></div>
            <div className="pl-3"><span className="text-teal-300">&quot;role&quot;</span><span className="text-neutral-400">: </span><span className="text-amber-400">&quot;ADMIN&quot;</span></div>
            <div><span className="text-neutral-400">{"}"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
