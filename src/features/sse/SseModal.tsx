import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X, Plus, Rss, Trash2, Zap, Unplug, Pause, Play, Copy, Check, RotateCcw } from "lucide-react";
import { useSseStore, type SseConnection, type SseEvent, type SseStatus } from "@/stores/sseStore";
import { uid } from "@/lib/factories";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STATUS_META: Record<SseStatus, { label: string; color: string; pulse?: boolean }> = {
  disconnected: { label: "Disconnected", color: "bg-text-muted" },
  connecting: { label: "Connecting…", color: "bg-yellow-500", pulse: true },
  open: { label: "Streaming", color: "bg-status-success" },
  closed: { label: "Closed", color: "bg-text-muted" },
  error: { label: "Error", color: "bg-status-error" },
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

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.events.length]);

  if (!open) return null;

  const handleCopyAll = () => {
    if (!active) return;
    navigator.clipboard.writeText(active.events.map((e) => `event: ${e.eventType}\ndata: ${e.data}`).join("\n\n"));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="flex h-[85vh] w-[1100px] max-w-full overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-[240px] shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
              <Rss size={15} className="text-[#14b8a6]" /> SSE
            </div>
            <button onClick={() => addConnection()} className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-accent" title="New stream">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {connections.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={clsx("group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left", c.id === activeConnectionId ? "bg-[#14b8a6]/15" : "hover:bg-bg-hover")}
              >
                <span className={clsx("h-2 w-2 shrink-0 rounded-full", STATUS_META[c.status].color, STATUS_META[c.status].pulse && "animate-pulse")} />
                <div className="min-w-0 flex-1">
                  <div className={clsx("truncate text-[13px]", c.id === activeConnectionId ? "font-medium text-text-primary" : "text-text-secondary")}>{c.name}</div>
                  <div className="truncate font-mono text-[11px] text-text-muted">{c.url}</div>
                </div>
                <Trash2
                  size={12}
                  className="shrink-0 text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeConnection(c.id);
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <input
              value={active?.name ?? ""}
              onChange={(e) => active && updateConnection(active.id, { name: e.target.value })}
              className="bg-transparent text-[15px] font-semibold text-text-primary outline-none"
              placeholder="Stream name"
            />
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
          </div>

          {active && (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <input
                  value={active.url}
                  onChange={(e) => updateConnection(active.id, { url: e.target.value })}
                  disabled={active.status === "open" || active.status === "connecting"}
                  placeholder="https://example.com/events"
                  className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted focus:border-[#14b8a6] focus:outline-none disabled:opacity-60"
                />
                {active.status === "open" || active.status === "connecting" ? (
                  <button onClick={() => disconnect(active.id)} className="flex items-center gap-1.5 rounded-md bg-status-error px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90">
                    <Unplug size={14} /> Disconnect
                  </button>
                ) : (
                  <button onClick={() => connect(active.id)} className="flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-black hover:bg-accent-hover">
                    <Zap size={14} /> Connect
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between border-b border-border px-4 py-1.5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <span className={clsx("h-2 w-2 rounded-full", STATUS_META[active.status].color, STATUS_META[active.status].pulse && "animate-pulse")} />
                    {STATUS_META[active.status].label}
                    {active.statusMessage && <span className="text-status-error">— {active.statusMessage}</span>}
                  </div>
                  <label className="flex items-center gap-1.5 text-[12px] text-text-muted">
                    <input type="checkbox" checked={active.autoReconnect} onChange={(e) => updateConnection(active.id, { autoReconnect: e.target.checked })} className="h-3.5 w-3.5 accent-[#14b8a6]" />
                    Auto reconnect
                  </label>
                </div>
                <div className="flex items-center gap-1">
                  {active.status === "open" && (
                    <button onClick={() => togglePause(active.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-text-secondary hover:bg-bg-hover">
                      {active.paused ? <Play size={12} /> : <Pause size={12} />} {active.paused ? "Resume" : "Pause"}
                    </button>
                  )}
                  <button onClick={handleCopyAll} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-text-secondary hover:bg-bg-hover">
                    <Copy size={12} /> Copy events
                  </button>
                  <button onClick={() => clearEvents(active.id)} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] text-text-secondary hover:bg-bg-hover">
                    <RotateCcw size={12} /> Clear
                  </button>
                  <div className="flex gap-1 pl-2">
                    {(["stream", "headers"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setSub(t)}
                        className={clsx("rounded-md px-2.5 py-1 text-[12px] capitalize", sub === t ? "bg-[#14b8a6]/20 text-[#5eead4]" : "text-text-secondary hover:bg-bg-hover")}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {sub === "headers" && <SseHeadersEditor conn={active} onChange={(headers) => updateConnection(active.id, { headers })} />}

              {sub === "stream" && (
                <div ref={logRef} className="flex-1 overflow-y-auto p-4">
                  {active.paused && (
                    <div className="mb-3 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-[12px] text-yellow-500">
                      Stream paused — new events are being held and will appear when you resume.
                    </div>
                  )}
                  {active.events.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-text-muted">No events yet — connect to start streaming.</div>
                  ) : (
                    <div className="space-y-2">
                      {active.events.map((e) => (
                        <EventCard key={e.id} event={e} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
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
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Request headers (e.g. Authorization, Last-Event-ID)</div>
      <div className="space-y-1.5">
        {withBlank.map((h) => (
          <div key={h.id} className="grid grid-cols-[24px_1fr_1fr_28px] items-center gap-2">
            <input type="checkbox" checked={h.enabled} onChange={(e) => update(h.id, { enabled: e.target.checked })} className="h-4 w-4 accent-[#14b8a6]" />
            <input value={h.key} onChange={(e) => update(h.id, { key: e.target.value })} placeholder="Key" className="rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none focus:bg-[#161616]" />
            <input value={h.value} onChange={(e) => update(h.id, { value: e.target.value })} placeholder="Value" className="rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none focus:bg-[#161616]" />
            <button onClick={() => remove(h.id)} className="flex items-center justify-center text-text-muted/40 hover:text-status-error">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: SseEvent }) {
  const [copied, setCopied] = useState(false);
  const time = new Date(event.timestamp).toLocaleTimeString([], { hour12: false });
  const display = (() => {
    try {
      return JSON.stringify(JSON.parse(event.data), null, 2);
    } catch {
      return event.data;
    }
  })();

  return (
    <div className="group relative rounded-lg border border-[#14b8a6]/25 bg-[#14b8a6]/5 px-3 py-2">
      <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
        <span className="rounded bg-[#14b8a6]/20 px-1.5 py-0.5 text-[#5eead4]">{event.eventType}</span>
        {event.eventId && <span className="font-normal normal-case text-text-muted">id: {event.eventId}</span>}
        <span className="ml-auto font-normal normal-case text-text-muted">{time}</span>
      </div>
      <pre className="whitespace-pre-wrap break-all font-mono text-[12.5px] text-text-primary">{display}</pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(event.data);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute -top-2 right-2 rounded bg-bg-elevated p-1 text-text-muted opacity-0 shadow hover:text-text-primary group-hover:opacity-100"
      >
        {copied ? <Check size={11} className="text-status-success" /> : <Copy size={11} />}
      </button>
    </div>
  );
}