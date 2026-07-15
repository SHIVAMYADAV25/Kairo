const distribution = [
  { label: "<50ms", pct: 22, color: "bg-emerald-500" },
  { label: "50-100ms", pct: 31, color: "bg-emerald-400" },
  { label: "100-200ms", pct: 18, color: "bg-yellow-400" },
  { label: "200-500ms", pct: 15, color: "bg-amber-500" },
  { label: "500ms-1s", pct: 10, color: "bg-orange-500" },
  { label: ">1s", pct: 4, color: "bg-red-500" },
];

const timeline = [
  { time: "0s", vus: 1, rps: 12, avg: "45ms", p95: "89ms", err: "0%", errColor: "text-emerald-400", avgColor: "text-emerald-400", p95Color: "text-emerald-400" },
  { time: "10s", vus: 20, rps: 234, avg: "52ms", p95: "112ms", err: "0%", errColor: "text-emerald-400", avgColor: "text-emerald-400", p95Color: "text-emerald-400" },
  { time: "20s", vus: 40, rps: 456, avg: "68ms", p95: "145ms", err: "0.2%", errColor: "text-yellow-400", avgColor: "text-emerald-400", p95Color: "text-emerald-400" },
  { time: "30s", vus: 60, rps: 612, avg: "95ms", p95: "210ms", err: "0.8%", errColor: "text-yellow-400", avgColor: "text-emerald-400", p95Color: "text-yellow-400" },
  { time: "40s", vus: 80, rps: 701, avg: "142ms", p95: "385ms", err: "2.1%", errColor: "text-red-400", avgColor: "text-yellow-400", p95Color: "text-yellow-400" },
  { time: "50s", vus: 100, rps: 724, avg: "289ms", p95: "820ms", err: "5.4%", errColor: "text-red-400", avgColor: "text-amber-400", p95Color: "text-red-400" },
  { time: "60s", vus: 100, rps: 680, avg: "341ms", p95: "950ms", err: "8.2%", errColor: "text-red-400", avgColor: "text-amber-400", p95Color: "text-red-400" },
];

export function StressTestVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-neutral-400">Stress Test</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider">
              Completed
            </span>
          </div>
          <span className="text-[11px] text-neutral-600 font-mono">60.0s elapsed</span>
        </div>
        <div className="grid grid-cols-4 gap-px bg-white/[0.04]">
          <div className="bg-neutral-950 p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Avg Response</div>
            <div className="text-lg font-bold text-amber-400">289ms</div>
            <div className="text-[10px] text-neutral-600">p95: 820ms</div>
          </div>
          <div className="bg-neutral-950 p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Throughput</div>
            <div className="text-lg font-bold text-orange-400">724</div>
            <div className="text-[10px] text-neutral-600">req/s peak</div>
          </div>
          <div className="bg-neutral-950 p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Error Rate</div>
            <div className="text-lg font-bold text-red-400">5.4%</div>
            <div className="text-[10px] text-neutral-600">342 errors</div>
          </div>
          <div className="bg-neutral-950 p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Total Reqs</div>
            <div className="text-lg font-bold text-emerald-400">38.2k</div>
            <div className="text-[10px] text-neutral-600">100 VUs peak</div>
          </div>
        </div>
        <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-2">
          <span className="text-[11px] text-amber-400">
            ⚠ Breaking point detected at ~80 VUs — error rate exceeded 5%
          </span>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Response Time Distribution</span>
        </div>
        <div className="p-4 space-y-2">
          {distribution.map((d) => (
            <div key={d.label} className="flex items-center gap-3 text-[11px]">
              <span className="w-16 text-neutral-500 text-right font-mono shrink-0">{d.label}</span>
              <div className="flex-1 h-4 bg-white/[0.03] rounded-sm overflow-hidden">
                <div className={`h-full rounded-sm ${d.color}`} style={{ width: `${d.pct}%` }} />
              </div>
              <span className="w-8 text-neutral-400 font-mono shrink-0">{d.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-white/[0.06]">
          <span className="text-[11px] text-neutral-500 font-medium">Timeline</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-neutral-600 border-b border-white/[0.04]">
                <th className="px-3 py-2 text-left font-medium">Time</th>
                <th className="px-3 py-2 text-right font-medium">VUs</th>
                <th className="px-3 py-2 text-right font-medium">RPS</th>
                <th className="px-3 py-2 text-right font-medium">Avg</th>
                <th className="px-3 py-2 text-right font-medium">p95</th>
                <th className="px-3 py-2 text-right font-medium">Errors</th>
              </tr>
            </thead>
            <tbody>
              {timeline.map((row) => (
                <tr key={row.time} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                  <td className="px-3 py-1.5 text-neutral-400 font-mono">{row.time}</td>
                  <td className="px-3 py-1.5 text-right text-orange-400 font-mono">{row.vus}</td>
                  <td className="px-3 py-1.5 text-right text-neutral-300 font-mono">{row.rps}</td>
                  <td className={`px-3 py-1.5 text-right font-mono ${row.avgColor}`}>{row.avg}</td>
                  <td className={`px-3 py-1.5 text-right font-mono ${row.p95Color}`}>{row.p95}</td>
                  <td className={`px-3 py-1.5 text-right font-mono ${row.errColor}`}>{row.err}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const testTypes = [
  { name: "Load Test", color: "orange", path: "M13 10V3L4 14h7v7l9-11h-7z" },
  { name: "Stress Test", color: "red", path: "M3 17l6-6 4 4 8-8M14 7h7m0 0v7" },
  { name: "Spike Test", color: "amber", path: "M8 12l2-8 2 16 2-8h4" },
  { name: "Soak Test", color: "purple", path: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "Assertions", color: "emerald", path: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "Chain Test", color: "cyan", path: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" },
];

const colorMap: Record<string, string> = {
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  red: "bg-red-500/10 border-red-500/20 text-red-400",
  amber: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  purple: "bg-purple-500/10 border-purple-500/20 text-purple-400",
  emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
};

export function QuickStartVisual() {
  return (
    <div className="space-y-3">
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-neutral-400">Quick Start</span>
          <span className="text-[10px] text-neutral-600">Choose a test type</span>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          {testTypes.map((t) => {
            const classes = colorMap[t.color].split(" ");
            const [bg, border, text] = classes;
            return (
              <div
                key={t.name}
                className={`${bg} ${border} border rounded-lg p-3 text-center cursor-pointer hover:brightness-125 transition`}
              >
                <svg className={`w-5 h-5 mx-auto mb-1.5 ${text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={t.path} />
                </svg>
                <div className={`text-[11px] font-medium ${text}`}>{t.name}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-400">Spike Test Results</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider">
              Done
            </span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/[0.04]">
          <div className="bg-neutral-950 p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Pre-Spike</div>
            <div className="text-sm font-semibold text-emerald-400">42ms avg</div>
            <div className="text-[10px] text-neutral-600">5 VUs · 10s</div>
          </div>
          <div className="bg-neutral-950 p-3 text-center border-x border-white/[0.04]">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Spike</div>
            <div className="text-sm font-semibold text-red-400">312ms avg</div>
            <div className="text-[10px] text-neutral-600">50 VUs · 5s</div>
          </div>
          <div className="bg-neutral-950 p-3 text-center">
            <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Recovery</div>
            <div className="text-sm font-semibold text-orange-400">58ms avg</div>
            <div className="text-[10px] text-neutral-600">5 VUs · 15s</div>
          </div>
        </div>
        <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center gap-2">
          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-medium">
            Recovery: 3.2s
          </span>
          <span className="text-[11px] text-neutral-500">Response times normalized within 3.2s after spike</span>
        </div>
      </div>
    </div>
  );
}
