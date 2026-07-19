import { AppleIcon, ChevronDownIcon, InfoIcon, LinuxIcon, WindowsIcon } from "./icons";

const perfBars = [38, 52, 41, 64, 48, 71, 55, 82, 60, 73, 88, 56, 67, 78, 60, 84, 71];

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="glow w-[600px] h-[600px] bg-orange-500/[0.10] top-0 left-1/2 -translate-x-1/2" />
      <div className="glow w-96 h-96 bg-amber-500/[0.06] top-40 left-1/4" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-neutral-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            v1.1.4 New theme, performance panel, cloud sync &amp; more
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 gradient-text leading-tight">
            The API client
            <br />
            that respects your time
          </h1>
          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            A blazing-fast native app built with Rust. HTTP, WebSocket, SSE, GraphQL, gRPC —
            with scriptable requests, cloud sync, and zero lock-in.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="#get-kairo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-200 hover:text-white"
            >
              <AppleIcon /> macOS
            </a>
            <a
              href="#get-kairo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-neutral-200 hover:text-white"
            >
              <WindowsIcon /> Windows
            </a>
            <div className="relative">
              <div className="flex items-center">
                <a
                  href="#get-kairo"
                  className="inline-flex items-center gap-2 rounded-l-lg text-sm font-medium transition-all px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-r-0 border-white/[0.08] text-neutral-200 hover:text-white"
                >
                  <LinuxIcon /> Linux <ChevronDownIcon />
                </a>
                <button
                  className="inline-flex items-center justify-center rounded-r-lg text-sm font-medium transition-all px-2 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-l border-white/[0.08] border-l-white/[0.12] text-neutral-400 hover:text-white"
                  title="Installation instructions"
                  aria-label="Installation instructions"
                >
                  <InfoIcon />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* App mockup */}
        <div className="relative mx-auto max-w-6xl">
          <div className="glow w-[600px] h-[400px] bg-orange-500/[0.18] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="relative glass-card rounded-xl overflow-hidden shadow-2xl shadow-black/60 border-white/[0.05]">
            {/* title bar */}
            <div className="flex items-center px-3 py-2 bg-black/30 border-b border-white/[0.06]">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <span className="flex-1 text-center text-[11px] text-neutral-500 font-medium">Kairo</span>
              <span className="w-12" />
            </div>

            {/* tab bar */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/20 border-b border-white/[0.06]">
              <div className="flex items-center gap-1">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] border border-emerald-500/40 text-[11px]">
                  <span className="font-mono font-semibold text-orange-400 text-[10px]">GET</span>
                  <span className="text-neutral-200">cats</span>
                  <button className="text-neutral-500 hover:text-neutral-300 ml-0.5" aria-label="Close tab">
                    <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
                    </svg>
                  </button>
                </div>
                <button className="w-5 h-5 rounded text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.05] flex items-center justify-center" aria-label="New tab">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-neutral-400 bg-white/[0.04] border border-white/[0.05]">
                  <span>No Environment</span>
                  <ChevronDownIcon className="w-2.5 h-2.5 text-neutral-500" />
                </div>
              </div>
            </div>

            <div className="flex h-[28rem]">
              {/* icon rail */}
              <div className="w-14 shrink-0 flex flex-col items-center bg-black/[0.35] border-r border-white/[0.06]">
                <div className="w-full py-2 flex flex-col items-center gap-0.5 border-b border-white/[0.06]">
                  <div className="w-7 h-7 rounded-md bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-[11px] font-bold text-white shadow-lg shadow-orange-500/20">
                    K
                  </div>
                </div>
                <div className="flex-1 w-full flex flex-col items-center pt-2 gap-0.5">
                  <button className="relative w-10 h-10 rounded-md flex items-center justify-center transition-colors text-orange-400 bg-orange-500/[0.12]" title="Collections">
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-orange-500" />
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.75 6.75A1.5 1.5 0 015.25 5.25h13.5a1.5 1.5 0 011.5 1.5v10.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V6.75zm2.25.75v9h12v-9h-12z" />
                    </svg>
                  </button>
                  <button className="relative w-10 h-10 rounded-md flex items-center justify-center transition-colors text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]" title="Environments">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.25a9.75 9.75 0 109.75 9.75A9.76 9.76 0 0012 2.25zm0 1.5c1.93 0 3.59 2.45 4.21 5.85h-8.42C8.41 6.2 10.07 3.75 12 3.75zm0 16.5c-1.93 0-3.59-2.45-4.21-5.85h8.42c-.62 3.4-2.28 5.85-4.21 5.85z" />
                    </svg>
                  </button>
                  <button className="relative w-10 h-10 rounded-md flex items-center justify-center transition-colors text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]" title="History">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4.5a7.5 7.5 0 107.5 7.5h-1.5a6 6 0 11-1.76-4.24l-2.49 2.49h6V4.25l-2.13 2.13A7.48 7.48 0 0012 4.5zm-.75 3.75v4.06l3.4 2.04.85-1.4-2.75-1.65V8.25h-1.5z" />
                    </svg>
                  </button>
                  <button className="relative w-10 h-10 rounded-md flex items-center justify-center transition-colors text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]" title="Runner">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5.25v13.5L19.25 12 8 5.25z" />
                    </svg>
                  </button>
                  <button className="relative w-10 h-10 rounded-md flex items-center justify-center transition-colors text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]" title="Analytics">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 21h18v-2H3v2zM5 17h2V8H5v9zm4 0h2V5H9v12zm4 0h2v-7h-2v7zm4 0h2V11h-2v6z" />
                    </svg>
                  </button>
                  <button className="relative w-10 h-10 rounded-md flex items-center justify-center transition-colors text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]" title="Mock server">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5a2.25 2.25 0 012.25 2.25v3a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 9.75v-3zm0 7.5A2.25 2.25 0 016.75 12h10.5a2.25 2.25 0 012.25 2.25v3a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-3zM7.5 7.875a.75.75 0 100 1.5.75.75 0 000-1.5zm0 7.5a.75.75 0 100 1.5.75.75 0 000-1.5z" />
                    </svg>
                  </button>
                </div>
                <button className="w-10 h-10 mb-2 rounded-md flex items-center justify-center text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04]" title="Settings">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.078 2.25a1 1 0 00-.917.6l-.78 1.71a8.04 8.04 0 00-1.59.92l-1.81-.6a1 1 0 00-1.13.46L3.6 7.43a1 1 0 00.13 1.21l1.34 1.27a8.05 8.05 0 000 1.84l-1.34 1.27a1 1 0 00-.13 1.21l1.25 2.09a1 1 0 001.13.46l1.81-.6a8 8 0 001.59.92l.78 1.71a1 1 0 00.917.6h1.844a1 1 0 00.917-.6l.78-1.71a8 8 0 001.59-.92l1.81.6a1 1 0 001.13-.46l1.25-2.09a1 1 0 00-.13-1.21l-1.34-1.27a8.05 8.05 0 000-1.84l1.34-1.27a1 1 0 00.13-1.21l-1.25-2.09a1 1 0 00-1.13-.46l-1.81.6a8 8 0 00-1.59-.92l-.78-1.71a1 1 0 00-.917-.6h-1.844zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z" />
                  </svg>
                </button>
              </div>

              {/* collections sidebar */}
              <div className="w-52 shrink-0 hidden md:flex md:flex-col border-r border-white/[0.06] bg-white/[0.01]">
                <div className="p-2.5 border-b border-white/[0.04]">
                  <div className="flex items-center gap-1.5 bg-white/[0.04] rounded px-2 py-1.5 text-[11px] text-neutral-500">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2M3.5 10.5a7 7 0 1114 0 7 7 0 01-14 0z" />
                    </svg>
                    <span>Search collections</span>
                  </div>
                </div>
                <div className="px-3 py-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">Collections</span>
                </div>
                <div className="flex-1 overflow-hidden px-1.5">
                  <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] text-neutral-300 hover:bg-white/[0.03]">
                    <ChevronDownIcon className="w-2.5 h-2.5 text-neutral-500 rotate-90" />
                    <svg className="w-3 h-3 text-orange-400/80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                    </svg>
                    <span className="font-medium">Playground</span>
                    <span className="ml-auto text-[9px] text-neutral-600">4 req</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 ml-4 py-1 rounded text-[11px] bg-orange-500/[0.14] text-white">
                    <span className="font-mono font-bold w-7 text-[9px] text-orange-400">GET</span>
                    <span className="truncate">cats</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 ml-4 py-1 rounded text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]">
                    <span className="font-mono font-bold w-7 text-[9px] text-orange-400">WS</span>
                    <span className="truncate">live-feed</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 ml-4 py-1 rounded text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]">
                    <span className="font-mono font-bold w-7 text-[9px] text-pink-400">GQL</span>
                    <span className="truncate">get-user</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 ml-4 py-1 rounded text-[11px] text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]">
                    <span className="font-mono font-bold w-7 text-[9px] text-orange-400">POST</span>
                    <span className="truncate">signup</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] text-neutral-300 hover:bg-white/[0.03]">
                    <ChevronDownIcon className="w-2.5 h-2.5 text-neutral-500" />
                    <svg className="w-3 h-3 text-orange-400/80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
                    </svg>
                    <span className="font-medium">Staging</span>
                    <span className="ml-auto text-[9px] text-neutral-600">6 req</span>
                  </div>
                </div>
                <div className="p-2 border-t border-white/[0.04]">
                  <button className="w-full flex items-center justify-center gap-1.5 text-[11px] font-medium text-orange-400 bg-orange-500/[0.10] hover:bg-orange-500/[0.18] border border-orange-500/20 rounded py-1.5">
                    + New Collection
                  </button>
                </div>
              </div>

              {/* main request/response */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center gap-1.5 p-2 border-b border-white/[0.06]">
                  <button className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-white/[0.04] border border-white/[0.05] text-[11px] font-mono font-bold text-orange-400">
                    GET <ChevronDownIcon className="w-2.5 h-2.5 text-neutral-500" />
                  </button>
                  <div className="flex-1 px-2.5 py-1.5 rounded bg-white/[0.04] border border-white/[0.05] text-[11px] font-mono text-neutral-300 truncate">
                    https://api.kairoapp.dev/v1/<span className="text-orange-400">cats</span>
                  </div>
                  <button className="flex items-center gap-1 px-2.5 py-1.5 rounded text-[11px] font-medium text-neutral-300 bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.06]">
                    Save
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-bold text-white bg-emerald-500 hover:bg-emerald-400 shadow-md shadow-emerald-500/30">
                    Send
                  </button>
                </div>

                <div className="flex items-center gap-1 px-2 border-b border-white/[0.06] text-[11px]">
                  {["Params", "Headers", "Body", "Auth", "Scripts"].map((tab, i) => (
                    <button
                      key={tab}
                      className={`px-2.5 py-1.5 border-b-2 transition-colors ${
                        i === 0 ? "border-emerald-500 text-white" : "border-transparent text-neutral-500"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold">200 OK</span>
                  <span className="text-neutral-400 font-mono">169 ms</span>
                  <span className="text-neutral-400 font-mono">11.13 KB</span>
                </div>

                <div className="flex-1 px-3 py-2 overflow-hidden font-mono text-[10.5px] leading-relaxed">
                  <div className="text-neutral-400">
                    <div><span className="text-neutral-500">{"{"}</span></div>
                    <div className="pl-3"><span className="text-orange-300">&quot;statusCode&quot;</span><span className="text-neutral-500">: </span><span className="text-amber-300">200</span><span className="text-neutral-500">,</span></div>
                    <div className="pl-3"><span className="text-orange-300">&quot;data&quot;</span><span className="text-neutral-500">: {"{"}</span></div>
                    <div className="pl-7"><span className="text-orange-300">&quot;page&quot;</span><span className="text-neutral-500">: </span><span className="text-amber-300">1</span><span className="text-neutral-500">,</span></div>
                    <div className="pl-7"><span className="text-orange-300">&quot;limit&quot;</span><span className="text-neutral-500">: </span><span className="text-amber-300">10</span><span className="text-neutral-500">,</span></div>
                    <div className="pl-7"><span className="text-orange-300">&quot;items&quot;</span><span className="text-neutral-500">: </span><span className="text-emerald-300">Array(10)</span></div>
                    <div className="pl-3"><span className="text-neutral-500">{"},"}</span></div>
                    <div className="pl-3"><span className="text-orange-300">&quot;message&quot;</span><span className="text-neutral-500">: </span><span className="text-emerald-300">&quot;OK&quot;</span><span className="text-neutral-500">,</span></div>
                    <div className="pl-3"><span className="text-orange-300">&quot;success&quot;</span><span className="text-neutral-500">: </span><span className="text-amber-300">true</span></div>
                    <div><span className="text-neutral-500">{"}"}</span></div>
                  </div>
                </div>
              </div>

              {/* performance panel */}
              <div className="w-60 shrink-0 hidden lg:flex lg:flex-col border-l border-white/[0.06] bg-white/[0.01]">
                <div className="flex items-center gap-1 px-2 py-1.5 border-b border-white/[0.06] text-[11px]">
                  <button className="px-2 py-1 rounded text-orange-400 border-b-2 border-orange-500 -mb-1.5">Performance</button>
                  <button className="px-2 py-1 text-neutral-500">Cookies</button>
                </div>
                <div className="flex flex-col items-center pt-3 pb-2 border-b border-white/[0.06]">
                  <div className="relative w-24 h-24">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth={6}
                        strokeLinecap="round"
                        strokeDasharray="276.46"
                        strokeDashoffset="41.47"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white">169</span>
                      <span className="text-[9px] text-neutral-500 -mt-0.5">ms</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-500 mt-1.5">Total Response Time</span>
                </div>
                <div className="px-3 py-2 border-b border-white/[0.06]">
                  <div className="text-[10px] text-neutral-500 mb-1.5">Response Time Over Time</div>
                  <div className="flex items-end gap-px h-14">
                    {perfBars.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-orange-500/80"
                        style={{ height: `${h}%`, opacity: 0.4 + i * 0.035 }}
                      />
                    ))}
                  </div>
                </div>
                <div className="px-3 py-2 space-y-1.5 border-b border-white/[0.06] text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">TTFB</span>
                    <span className="text-neutral-300 font-mono">168 ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Download</span>
                    <span className="text-neutral-300 font-mono">1 ms</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
                    <span className="text-neutral-300 font-medium">Total</span>
                    <span className="text-orange-400 font-mono font-semibold">169 ms</span>
                  </div>
                </div>
                <div className="flex-1 px-3 py-2 space-y-1.5 text-[10px]">
                  <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">Response Info</div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Status</span>
                    <span className="text-emerald-400 font-mono">200 OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Content Type</span>
                    <span className="text-neutral-300 font-mono">application/json</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Content Length</span>
                    <span className="text-neutral-300 font-mono">11.13 KB</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-white/[0.06] bg-black/30 text-[10px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Ready
              </span>
              <span className="ml-auto font-mono">Built v1.1.4</span>
              <span>·</span>
              <span>Made with care</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
