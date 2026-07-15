export default function EvolutionMockup() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 not-prose">
      {/* v0 - the "crap" version */}
      <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-neutral-900">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-neutral-800/60">
          <span className="text-[11px] font-mono text-neutral-400">kairo — day 1</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-semibold uppercase tracking-wider">
            v0.0.1
          </span>
        </div>
        <div className="p-6 flex flex-col gap-3 items-stretch">
          <input
            disabled
            placeholder="https://example.com"
            className="w-full px-3 py-2 rounded border border-neutral-700 bg-neutral-800 text-neutral-400 text-sm placeholder:text-neutral-600"
          />
          <input
            disabled
            placeholder='{ "raw body" }'
            className="w-full px-3 py-2 rounded border border-neutral-700 bg-neutral-800 text-neutral-400 text-sm placeholder:text-neutral-600"
          />
          <button
            disabled
            className="w-full px-3 py-2 rounded bg-neutral-700 text-neutral-300 text-sm font-medium"
          >
            send
          </button>
          <p className="text-[11px] text-neutral-600 text-center pt-2">
            that&apos;s it. that was the whole app.
          </p>
        </div>
      </div>

      {/* today */}
      <div className="rounded-xl overflow-hidden border border-orange-500/20 bg-neutral-900">
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.08] bg-neutral-800/60">
          <span className="text-[11px] font-mono text-neutral-400">kairo — today</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold uppercase tracking-wider">
            v0.4.0
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] font-mono font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded">GET</span>
            <div className="flex-1 bg-white/[0.04] rounded px-2 py-1 text-[10px] font-mono text-neutral-400 truncate">
              {"{{base_url}}"}/v1/cats
            </div>
            <span className="text-[9px] px-2 py-1 rounded bg-emerald-500 text-white font-semibold">Send</span>
          </div>
          <div className="flex items-center gap-1 mb-2 text-[9px]">
            {["Params", "Headers", "Body", "Auth", "Scripts"].map((t, i) => (
              <span key={t} className={`px-1.5 py-0.5 rounded ${i === 2 ? "bg-white/[0.06] text-white" : "text-neutral-600"}`}>
                {t}
              </span>
            ))}
          </div>
          <div className="rounded bg-black/30 p-2 font-mono text-[9.5px] text-neutral-500 space-y-0.5">
            <div><span className="text-orange-300">&quot;statusCode&quot;</span>: <span className="text-amber-300">200</span></div>
            <div><span className="text-orange-300">&quot;message&quot;</span>: <span className="text-emerald-300">&quot;OK&quot;</span></div>
          </div>
          <p className="text-[11px] text-neutral-600 text-center pt-3">
            same core idea. a lot more of everything else.
          </p>
        </div>
      </div>
    </div>
  );
}
