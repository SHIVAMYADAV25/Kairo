import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  X, Plus, Radio, Trash2, Zap, Unplug, Send, RotateCcw, Copy, Check, Binary,
} from "lucide-react";
import { useSocketStore, type SocketConnection, type SocketMessage, type SocketStatus } from "@/stores/socketStore";
import { uid } from "@/lib/factories";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STATUS_META: Record<SocketStatus, { label: string; color: string; pulse?: boolean }> = {
  disconnected: { label: "Disconnected", color: "bg-text-muted" },
  connecting: { label: "Connecting…", color: "bg-yellow-500", pulse: true },
  open: { label: "Connected", color: "bg-status-success" },
  closed: { label: "Closed", color: "bg-text-muted" },
  error: { label: "Error", color: "bg-status-error" },
};

export function SocketsModal({ open, onClose }: Props) {
  const {
    connections, activeConnectionId, ensureListeners, addConnection, removeConnection,
    setActive, updateConnection, connect, disconnect, send, clearMessages,
  } = useSocketStore();

  const [sub, setSub] = useState<"messages" | "headers">("messages");
  const [composer, setComposer] = useState("");
  const [composerBinary, setComposerBinary] = useState(false);
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
  }, [active?.messages.length]);

  if (!open) return null;

  const handleSend = () => {
    if (!active || !composer.trim()) return;
    send(active.id, composer, composerBinary);
    setComposer("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex h-[85vh] w-[1100px] max-w-full overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: connection list */}
        <div className="flex w-[240px] shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
              <Radio size={15} className="text-[#a855f7]" /> Sockets
            </div>
            <button onClick={() => addConnection()} className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-accent" title="New connection">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {connections.map((c) => (
              <ConnectionListItem key={c.id} conn={c} isActive={c.id === activeConnectionId} onSelect={() => setActive(c.id)} onDelete={() => removeConnection(c.id)} />
            ))}
          </div>
        </div>

        {/* Right: workspace */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <input
              value={active?.name ?? ""}
              onChange={(e) => active && updateConnection(active.id, { name: e.target.value })}
              className="bg-transparent text-[15px] font-semibold text-text-primary outline-none"
              placeholder="Connection name"
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
                  placeholder="wss://example.com/socket"
                  className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted focus:border-[#a855f7] focus:outline-none disabled:opacity-60"
                />
                {active.status === "open" || active.status === "connecting" ? (
                  <button
                    onClick={() => disconnect(active.id)}
                    className="flex items-center gap-1.5 rounded-md bg-status-error px-3.5 py-2 text-[13px] font-medium text-white hover:opacity-90"
                  >
                    <Unplug size={14} /> Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect(active.id)}
                    className="flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-[13px] font-medium text-black hover:bg-accent-hover"
                  >
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
                    <input
                      type="checkbox"
                      checked={active.autoReconnect}
                      onChange={(e) => updateConnection(active.id, { autoReconnect: e.target.checked })}
                      className="h-3.5 w-3.5 accent-[#a855f7]"
                    />
                    Auto reconnect
                  </label>
                </div>
                <div className="flex gap-1">
                  {(["messages", "headers"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSub(t)}
                      className={clsx(
                        "rounded-md px-2.5 py-1 text-[12px] capitalize",
                        sub === t ? "bg-[#a855f7]/20 text-[#c084fc]" : "text-text-secondary hover:bg-bg-hover"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {sub === "headers" && <HeadersEditor conn={active} onChange={(headers) => updateConnection(active.id, { headers })} />}

              {sub === "messages" && (
                <>
                  <div ref={logRef} className="flex-1 overflow-y-auto p-4">
                    {active.messages.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-text-muted">
                        No messages yet — connect and send something.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {active.messages.map((m) => (
                          <MessageBubble key={m.id} message={m} />
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[11px] text-text-muted">
                        <input type="checkbox" checked={composerBinary} onChange={(e) => setComposerBinary(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
                        <Binary size={12} /> Send as base64 binary
                      </label>
                      <button onClick={() => clearMessages(active.id)} className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary">
                        <RotateCcw size={11} /> Clear log
                      </button>
                    </div>
                    <div className="flex items-end gap-2">
                      <textarea
                        value={composer}
                        onChange={(e) => setComposer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={active.status === "open" ? "Type a message… (Enter to send, Shift+Enter for newline)" : "Connect first to send messages"}
                        disabled={active.status !== "open"}
                        rows={2}
                        className="flex-1 resize-none rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted focus:border-[#a855f7] focus:outline-none disabled:opacity-60"
                      />
                      <button
                        onClick={handleSend}
                        disabled={active.status !== "open" || !composer.trim()}
                        className="flex items-center gap-1.5 self-stretch rounded-md bg-accent px-4 text-[13px] font-medium text-black hover:bg-accent-hover disabled:opacity-40"
                      >
                        <Send size={14} /> Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectionListItem({ conn, isActive, onSelect, onDelete }: { conn: SocketConnection; isActive: boolean; onSelect: () => void; onDelete: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={clsx(
        "group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left",
        isActive ? "bg-[#a855f7]/15" : "hover:bg-bg-hover"
      )}
    >
      <span className={clsx("h-2 w-2 shrink-0 rounded-full", STATUS_META[conn.status].color, STATUS_META[conn.status].pulse && "animate-pulse")} />
      <div className="min-w-0 flex-1">
        <div className={clsx("truncate text-[13px]", isActive ? "font-medium text-text-primary" : "text-text-secondary")}>{conn.name}</div>
        <div className="truncate font-mono text-[11px] text-text-muted">{conn.url}</div>
      </div>
      <Trash2
        size={12}
        className="shrink-0 text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      />
    </button>
  );
}

function HeadersEditor({ conn, onChange }: { conn: SocketConnection; onChange: (headers: SocketConnection["headers"]) => void }) {
  const withBlank = conn.headers.length === 0 || conn.headers[conn.headers.length - 1].key !== ""
    ? [...conn.headers, { id: uid(), key: "", value: "", enabled: true }]
    : conn.headers;

  const update = (id: string, patch: Partial<SocketConnection["headers"][number]>) => {
    const next = withBlank.map((h) => (h.id === id ? { ...h, ...patch } : h));
    onChange(next.filter((h, i) => h.key !== "" || i === next.length - 1));
  };
  const remove = (id: string) => onChange(withBlank.filter((h) => h.id !== id));

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Handshake headers (e.g. Authorization)</div>
      <div className="space-y-1.5">
        {withBlank.map((h) => (
          <div key={h.id} className="grid grid-cols-[24px_1fr_1fr_28px] items-center gap-2">
            <input type="checkbox" checked={h.enabled} onChange={(e) => update(h.id, { enabled: e.target.checked })} className="h-4 w-4 accent-[#a855f7]" />
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

function MessageBubble({ message }: { message: SocketMessage }) {
  const [copied, setCopied] = useState(false);
  const isSent = message.direction === "sent";

  const display = (() => {
    if (message.isBinary) return `[binary, base64] ${message.data.slice(0, 200)}${message.data.length > 200 ? "…" : ""}`;
    try {
      return JSON.stringify(JSON.parse(message.data), null, 2);
    } catch {
      return message.data;
    }
  })();

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour12: false });

  return (
    <div className={clsx("flex", isSent ? "justify-end" : "justify-start")}>
      <div className={clsx("group relative max-w-[70%] rounded-lg border px-3 py-2", isSent ? "border-accent/30 bg-accent/10" : "border-[#a855f7]/30 bg-[#a855f7]/10")}>
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide">
          <span className={isSent ? "text-accent" : "text-[#c084fc]"}>{isSent ? "↑ Sent" : "↓ Received"}</span>
          <span className="font-normal normal-case text-text-muted">{time}</span>
        </div>
        <pre className="whitespace-pre-wrap break-all font-mono text-[12.5px] text-text-primary">{display}</pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(message.data);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="absolute -top-2 right-2 rounded bg-bg-elevated p-1 text-text-muted opacity-0 shadow hover:text-text-primary group-hover:opacity-100"
        >
          {copied ? <Check size={11} className="text-status-success" /> : <Copy size={11} />}
        </button>
      </div>
    </div>
  );
}