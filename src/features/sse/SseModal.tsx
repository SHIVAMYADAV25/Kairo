import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X, Plus, Rss, Trash2, Zap, Unplug, Pause, Play, Copy, Check, RotateCcw, AlertCircle, Radio } from "lucide-react";
import { useSseStore, type SseConnection, type SseEvent, type SseStatus } from "@/stores/sseStore";
import { uid } from "@/lib/factories";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STATUS_META: Record<SseStatus, { label: string; bg: string; text: string; dot: string; pulse?: boolean }> = {
  disconnected: { label: "Disconnected", bg: "bg-neutral-950", text: "text-neutral-400", dot: "bg-neutral-500" },
  connecting: { label: "Connecting", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500", pulse: true },
  open: { label: "Streaming", bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-500" },
  closed: { label: "Closed", bg: "bg-neutral-950", text: "text-neutral-400", dot: "bg-neutral-500" },
  error: { label: "Error Instance", bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-500" },
};

export function SseModal({ open, onClose }: Props) {
  const {
    connections, activeConnectionId, ensureListeners, addConnection, removeConnection,
    setActive, updateConnection, connect, disconnect, togglePause, clearEvents,
  } = useSseStore();
  const [sub, setSub] = useState<"stream" | "headers">("stream");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) ensureListeners();
  }, [open, ensureListeners]);

  useEffect(() => {
    if (open && connections.length === 0) addConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const active = connections.find((c) => c.id === activeConnectionId) ?? null;

  // Handles strict anchor-scrolling down to the target stream viewport
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [active?.events?.length, sub]);

  if (!open) return null;

  const handleCopyAll = () => {
    if (!active) return;
    navigator.clipboard.writeText(active.events.map((e) => `event: ${e.eventType}\ndata: ${e.data}`).join("\n\n"));
  };

  const handleDisconnect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    disconnect(id);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans text-[12px] select-none text-white backdrop-blur-xs" 
      onClick={onClose}
    >
      <div 
        className="flex h-[640px] w-[1020px] max-w-full overflow-hidden rounded-md border border-[var(--c-222222)] bg-[var(--c-0c0c0c)] shadow-2xl transition-all" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= LEFT SIDEBAR CONNECTIONS LIST ================= */}
        <div className="flex w-[250px] shrink-0 flex-col border-r border-[var(--c-1a1a1a)] bg-[var(--c-090909)]">
          <div className="flex h-12 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-neutral-200">
              <Rss size={14} className="text-teal-500" /> SSE Streams
            </div>
            <button 
              onClick={() => addConnection()} 
              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--c-242424)] bg-[var(--c-121212)] text-neutral-400 transition-all hover:border-teal-600 hover:text-white"
              title="New stream connection"
            >
              <Plus size={14} />
            </button>
          </div>
          
          {/* Rigid Sidebar Frame Viewport Scroll */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
            {connections.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={clsx(
                  "group flex w-full flex-col items-start gap-1 rounded px-3 py-2.5 text-left border transition-all",
                  c.id === activeConnectionId 
                    ? "bg-[var(--c-111615)] border-teal-900/40 shadow-inner" 
                    : "bg-transparent border-transparent hover:bg-[var(--c-121212)]"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_META[c.status].dot, STATUS_META[c.status].pulse && "animate-pulse")} />
                    <span className={clsx("truncate text-[12px] font-medium", c.id === activeConnectionId ? "text-teal-400" : "text-neutral-300")}>
                      {c.name || "Untitled Stream"}
                    </span>
                  </div>
                  <Trash2
                    size={13}
                    className="shrink-0 text-neutral-600 opacity-0 hover:text-rose-500 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(c.id);
                    }}
                  />
                </div>
                <div className="w-full truncate font-mono text-[10px] text-neutral-500 leading-none">
                  {c.url || "https://..."}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= MAIN CONFIGURATION / WORKSPACE AREA ================= */}
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--c-0c0c0c)]">
          {active ? (
            <>
              {/* Workspace Top Header Bar */}
              <div className="flex h-12 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4 shrink-0">
                <input
                  value={active.name ?? ""}
                  onChange={(e) => updateConnection(active.id, { name: e.target.value })}
                  className="bg-transparent text-[14px] font-medium text-neutral-200 outline-none placeholder:text-neutral-600 focus:text-white"
                  placeholder="Connection configuration name..."
                />
                <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* Endpoint Connect Control Bar */}
              <div className="flex items-center gap-2 border-b border-[var(--c-1a1a1a)] bg-[var(--c-090909)]/40 p-3 shrink-0">
                <input
                  value={active.url}
                  onChange={(e) => updateConnection(active.id, { url: e.target.value })}
                  disabled={active.status === "open" || active.status === "connecting"}
                  placeholder="https://api.example.com/v1/stream"
                  className="flex-1 h-[32px] rounded border border-[var(--c-262626)] bg-[var(--c-121212)] px-3 font-mono text-[12px] text-neutral-200 outline-none transition-colors focus:border-teal-600/80 disabled:opacity-50"
                />
                
                {active.status === "open" || active.status === "connecting" ? (
                  <button
                    onClick={(e) => handleDisconnect(e, active.id)}
                    className="flex h-[32px] items-center gap-1.5 rounded bg-rose-950/30 border border-rose-900/50 px-4 text-[12px] font-medium text-rose-400 hover:bg-rose-900/50 transition-colors shrink-0"
                  >
                    <Unplug size={14} /> Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect(active.id)}
                    className="flex h-[32px] items-center gap-1.5 rounded bg-teal-600 px-4 text-[12px] font-semibold text-white hover:bg-teal-500 shadow-lg shadow-teal-900/20 transition-colors shrink-0"
                  >
                    <Zap size={14} /> Connect
                  </button>
                )}
              </div>

              {/* Toolbar Context Console Sub-bar */}
              <div className="flex h-9 items-center justify-between border-b border-[var(--c-1a1a1a)] bg-[var(--c-090909)] px-4 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0", STATUS_META[active.status].bg, STATUS_META[active.status].text)}>
                    <span className={clsx("h-1.5 w-1.5 rounded-full", STATUS_META[active.status].dot)} />
                    {STATUS_META[active.status].label}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-500 hover:text-neutral-400 text-[11px] shrink-0">
                    <input
                      type="checkbox"
                      checked={active.autoReconnect}
                      onChange={(e) => updateConnection(active.id, { autoReconnect: e.target.checked })}
                      className="peer hidden"
                    />
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded border border-neutral-700 bg-neutral-900 peer-checked:border-teal-500 peer-checked:bg-teal-600 text-white font-bold text-[8px]">
                      {active.autoReconnect && "✓"}
                    </div>
                    <span>Auto-reconnect</span>
                  </label>
                </div>

                {/* Stream Console Controls & Tabs */}
                <div className="flex h-full items-center gap-1 border-l border-[var(--c-1a1a1a)] pl-2">
                  {active.status === "open" && (
                    <button 
                      onClick={() => togglePause(active.id)} 
                      className="flex h-6 items-center gap-1 rounded px-2 text-[11px] text-neutral-400 hover:bg-[var(--c-141414)] hover:text-white transition-colors"
                    >
                      {active.paused ? <Play size={12} className="text-emerald-400" /> : <Pause size={12} className="text-amber-400" />} 
                      {active.paused ? "Resume" : "Pause"}
                    </button>
                  )}
                  <button 
                    onClick={handleCopyAll} 
                    className="flex h-6 items-center gap-1 rounded px-2 text-[11px] text-neutral-400 hover:bg-[var(--c-141414)] hover:text-white transition-colors"
                  >
                    <Copy size={12} /> Copy Output
                  </button>
                  <button 
                    onClick={() => clearEvents(active.id)} 
                    className="flex h-6 items-center gap-1 rounded px-2 text-[11px] text-neutral-400 hover:bg-[var(--c-141414)] hover:text-white transition-colors"
                  >
                    <RotateCcw size={12} /> Clear Console
                  </button>
                  
                  <div className="flex h-full ml-1 border-l border-[var(--c-1a1a1a)]">
                    {(["stream", "headers"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setSub(tab)}
                        className={clsx(
                          "relative h-full px-4 text-[11px] font-medium tracking-wide uppercase transition-colors border-r border-[var(--c-1a1a1a)]",
                          sub === tab ? "bg-[var(--c-111111)] text-teal-400 font-semibold" : "text-neutral-500 hover:text-neutral-300"
                        )}
                      >
                        {tab}
                        {sub === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main Container Layer (Rigid viewport heights configured) */}
              <div className="flex-1 flex flex-col min-h-0 bg-[var(--c-070707)] overflow-hidden">
                {/* Error Banner Notification Bar */}
                {active.statusMessage && (
                  <div className="flex items-center gap-2 border-b border-rose-950/40 bg-rose-950/20 px-4 py-2 text-[11px] text-rose-400 shrink-0 animate-fade-in font-mono">
                    <AlertCircle size={14} className="shrink-0 text-rose-500" />
                    <span className="font-semibold uppercase tracking-wider">Stream Connection Failure:</span>
                    <span className="truncate">{active.statusMessage}</span>
                  </div>
                )}

                {sub === "headers" && (
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
                    <SseHeadersEditor conn={active} onChange={(headers) => updateConnection(active.id, { headers })} />
                  </div>
                )}

                {sub === "stream" && (
                  <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
                    {active.paused && (
                      <div className="flex items-center gap-2 rounded border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-400 font-mono shadow-xs">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Stream Pipeline Paused. Real-time event propagation is held in virtual stack layer until resumed.</span>
                      </div>
                    )}

                    {active.events.length === 0 ? (
                      <div className="flex h-full flex-col items-center justify-center text-neutral-600 gap-2 font-mono">
                        <Radio size={24} className="stroke-1 opacity-40 animate-pulse" />
                        <span>Console Idle. Ready to receive Server-Sent Events frames.</span>
                      </div>
                    ) : (
                      active.events.map((e) => <EventCard key={e.id} event={e} />)
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-neutral-500 font-mono">
              Select or open a new event stream instance from the side panel to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SseHeadersEditor({ conn, onChange }: { conn: SseConnection; onChange: (headers: SseConnection["headers"]) => void }) {
  const withBlank = conn.headers.length === 0 || conn.headers[conn.headers.length - 1].key !== ""
    ? [...conn.headers, { id: uid(), key: "", value: "", enabled: true }]
    : conn.headers;

  const update = (id: string, patch: Partial<SseConnection["headers"][number]>) => {
    const next = withBlank.map((h) => (h.id === id ? { ...h, ...patch } : h));
    onChange(next.filter((h, i) => h.key !== "" || i === next.length - 1));
  };
  const remove = (id: string) => onChange(withBlank.filter((h) => h.id !== id));

  return (
    <div className="p-4 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">HTTP Handshake Connection Request Headers</div>
      <div className="space-y-1.5">
        {withBlank.map((h) => (
          <div key={h.id} className="grid grid-cols-[24px_1fr_1fr_28px] items-center gap-2">
            <label className="flex items-center justify-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={h.enabled} 
                onChange={(e) => update(h.id, { enabled: e.target.checked })} 
                className="peer hidden" 
              />
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded border border-neutral-700 bg-neutral-900 peer-checked:border-teal-500 peer-checked:bg-teal-600 text-white font-bold text-[8px]">
                {h.enabled && "✓"}
              </div>
            </label>
            <input 
              value={h.key} 
              onChange={(e) => update(h.id, { key: e.target.value })} 
              placeholder="Header Key (e.g. Authorization)" 
              className="rounded border border-[var(--c-222222)] bg-[var(--c-111111)] px-3 py-1.5 font-mono text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-teal-950 focus:bg-[var(--c-141414)]" 
            />
            <input 
              value={h.value} 
              onChange={(e) => update(h.id, { value: e.target.value })} 
              placeholder="Value" 
              className="rounded border border-[var(--c-222222)] bg-[var(--c-111111)] px-3 py-1.5 font-mono text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-teal-950 focus:bg-[var(--c-141414)]" 
            />
            <button 
              onClick={() => remove(h.id)} 
              className="flex items-center justify-center h-7 w-7 rounded hover:bg-rose-950/20 text-neutral-600 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: SseEvent }) {
  const [copied, setCopied] = useState(false);
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const display = (() => {
    try {
      return JSON.stringify(JSON.parse(event.data), null, 2);
    } catch {
      return event.data;
    }
  })();

  return (
    <div className="w-full border border-[var(--c-161d1b)] bg-[var(--c-0b0d0c)] rounded overflow-hidden shadow-xs">
      {/* Event Top Data Context Control Panel */}
      <div className="flex h-7 items-center justify-between border-b border-[var(--c-141c19)] bg-[var(--c-0d1210)] px-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[9px] font-bold text-teal-400 uppercase tracking-wider">
            {event.eventType || "message"}
          </span>
          {event.eventId && (
            <span className="font-mono text-[10px] text-neutral-400 bg-neutral-900 px-1 rounded border border-[var(--c-222222)]">
              id: {event.eventId}
            </span>
          )}
          <span className="font-mono text-[10px] text-neutral-500">{time}</span>
        </div>

        {/* Copy System */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(event.data);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-neutral-400 hover:bg-[var(--c-151f1c)] hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check size={11} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy size={11} />
              <span>Copy Data</span>
            </>
          )}
        </button>
      </div>

      {/* Structured Code Frame Window Viewport */}
      <div className="p-3 bg-[var(--c-060807)]">
        <pre className="max-h-[240px] overflow-y-auto whitespace-pre-wrap break-all font-mono text-[12px] text-neutral-300 selection:bg-teal-900/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
          {display}
        </pre>
      </div>
    </div>
  );
}