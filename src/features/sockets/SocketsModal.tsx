import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  X, Plus, Radio, Trash2, Zap, Unplug, Send, RotateCcw, Copy, Check, Binary, HardDrive, FileCode
} from "lucide-react";
import { useSocketStore, type SocketConnection, type SocketMessage, type SocketStatus } from "@/stores/socketStore";
import { uid } from "@/lib/factories";

interface Props {
  open: boolean;
  onClose: () => void;
}

const STATUS_META: Record<SocketStatus, { label: string; bg: string; text: string; dot: string; pulse?: boolean }> = {
  disconnected: { label: "Disconnected", bg: "bg-bg-elevated", text: "text-text-secondary", dot: "bg-text-muted" },
  connecting: { label: "Connecting", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500", pulse: true },
  open: { label: "Connected", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
  closed: { label: "Closed", bg: "bg-bg-elevated", text: "text-text-secondary", dot: "bg-text-muted" },
  error: { label: "Error", bg: "bg-rose-500/10", text: "text-rose-400", dot: "bg-rose-500" },
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
  }, [open, connections.length, addConnection]);

  const active = connections.find((c) => c.id === activeConnectionId) ?? null;

  // Handles smooth anchoring to latest console logs when frame arrays populate
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [active?.messages?.length, sub]);

  if (!open) return null;

  const handleSend = () => {
    if (!active || !composer.trim()) return;
    send(active.id, composer, composerBinary);
    setComposer("");
  };

  const handleDisconnect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    disconnect(id);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans text-[12px] select-none text-text-primary backdrop-blur-xs" 
      onClick={onClose}
    >
      <div
        className="flex h-[640px] w-[1020px] max-w-full overflow-hidden rounded-md border border-[var(--c-222222)] bg-[var(--c-0c0c0c)] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= LEFT SIDEBAR CONNECTIONS LIST ================= */}
        <div className="flex w-[250px] shrink-0 flex-col border-r border-[var(--c-1a1a1a)] bg-[var(--c-090909)]">
          <div className="flex h-12 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-text-primary">
              <Radio size={14} className="text-purple-500" /> WebSockets
            </div>
            <button 
              onClick={() => addConnection()} 
              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--c-242424)] bg-[var(--c-121212)] text-text-secondary transition-all hover:border-purple-600 hover:text-white"
              title="Create new Client Connection"
            >
              <Plus size={14} />
            </button>
          </div>
          
          {/* Strict Independent View Container Frame Scroll */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
            {connections.map((c) => (
              <button
                key={c.id}
                onClick={() => setActive(c.id)}
                className={clsx(
                  "group flex w-full flex-col items-start gap-1 rounded px-3 py-2.5 text-left border transition-all",
                  c.id === activeConnectionId 
                    ? "bg-[var(--c-141218)] border-purple-900/50 shadow-inner" 
                    : "bg-transparent border-transparent hover:bg-[var(--c-121212)]"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", STATUS_META[c.status].dot, STATUS_META[c.status].pulse && "animate-pulse")} />
                    <span className={clsx("truncate text-[12px] font-medium", c.id === activeConnectionId ? "text-purple-400" : "text-text-secondary")}>
                      {c.name || "Untitled Socket"}
                    </span>
                  </div>
                  <Trash2
                    size={13}
                    className="shrink-0 text-text-muted opacity-0 hover:text-rose-500 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeConnection(c.id);
                    }}
                  />
                </div>
                <div className="w-full truncate font-mono text-[10px] text-text-muted leading-none">
                  {c.url || "wss://..."}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= MAIN CONFIGURATION AREA ================= */}
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--c-0c0c0c)]">
          {active ? (
            <>
              {/* Workspace Header Panel */}
              <div className="flex h-12 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4 shrink-0">
                <input
                  value={active.name ?? ""}
                  onChange={(e) => updateConnection(active.id, { name: e.target.value })}
                  className="bg-transparent text-[14px] font-medium text-text-primary outline-none placeholder:text-text-muted focus:text-white"
                  placeholder="Connection name..."
                />
                <button onClick={onClose} className="text-text-muted hover:text-text-secondary transition-colors">
                  <X size={16} />
                </button>
              </div>

              {/* URL Connect Control bar */}
              <div className="flex items-center gap-2 border-b border-[var(--c-1a1a1a)] bg-[var(--c-090909)]/40 p-3 shrink-0">
                <input
                  value={active.url}
                  onChange={(e) => updateConnection(active.id, { url: e.target.value })}
                  disabled={active.status === "open" || active.status === "connecting"}
                  placeholder="wss://echo.websocket.org"
                  className="flex-1 h-[32px] rounded border border-[var(--c-262626)] bg-[var(--c-121212)] px-3 font-mono text-[12px] text-text-primary outline-none transition-colors focus:border-purple-600/80 disabled:opacity-50"
                />
                
                {active.status === "open" || active.status === "connecting" ? (
                  <button
                    onClick={(e) => handleDisconnect(e, active.id)}
                    className="flex h-[32px] items-center gap-1.5 rounded bg-rose-950/30 border border-rose-900/50 px-4 text-[12px] font-medium text-rose-400 hover:bg-rose-900/50 transition-colors"
                  >
                    <Unplug size={14} /> Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect(active.id)}
                    className="flex h-[32px] items-center gap-1.5 rounded bg-purple-600 px-4 text-[12px] font-semibold text-white hover:bg-purple-500 shadow-lg shadow-purple-900/20 transition-colors"
                  >
                    <Zap size={14} /> Connect
                  </button>
                )}
              </div>

              {/* View Controller Context bar */}
              <div className="flex h-9 items-center justify-between border-b border-[var(--c-1a1a1a)] bg-[var(--c-090909)] px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className={clsx("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", STATUS_META[active.status].bg, STATUS_META[active.status].text)}>
                    <span className={clsx("h-1.5 w-1.5 rounded-full", STATUS_META[active.status].dot)} />
                    {STATUS_META[active.status].label}
                  </div>
                  {active.statusMessage && (
                    <span className="truncate max-w-[200px] text-[11px] text-rose-400/80 font-mono">
                      ({active.statusMessage})
                    </span>
                  )}

                  <label className="flex items-center gap-2 cursor-pointer select-none text-text-muted hover:text-text-secondary ml-2">
                    <input
                      type="checkbox"
                      checked={active.autoReconnect}
                      onChange={(e) => updateConnection(active.id, { autoReconnect: e.target.checked })}
                      className="peer hidden"
                    />
                    <div className="flex h-3.5 w-3.5 items-center justify-center rounded border border-border bg-bg-elevated peer-checked:border-purple-500 peer-checked:bg-purple-600 text-white font-bold text-[8px]">
                      {active.autoReconnect && "✓"}
                    </div>
                    <span>Auto-reconnect</span>
                  </label>
                </div>

                {/* Tabs switcher */}
                <div className="flex h-full border-l border-[var(--c-1a1a1a)]">
                  {(["messages", "headers"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setSub(tab)}
                      className={clsx(
                        "relative h-full px-4 text-[11px] font-medium tracking-wide uppercase transition-colors border-r border-[var(--c-1a1a1a)]",
                        sub === tab ? "bg-[var(--c-111111)] text-purple-400 font-semibold" : "text-text-muted hover:text-text-secondary"
                      )}
                    >
                      {tab}
                      {sub === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-purple-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Workspace Frame Container - Rigid heights setup */}
              <div className="flex-1 flex flex-col min-h-0 bg-[var(--c-070707)] overflow-hidden">
                {sub === "headers" && (
                  <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
                    <HeadersEditor conn={active} onChange={(headers) => updateConnection(active.id, { headers })} />
                  </div>
                )}

                {sub === "messages" && (
                  <>
                    {/* Log Terminal Frame */}
                    <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
                      {active.messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-text-muted gap-2 font-mono">
                          <FileCode size={24} className="stroke-1 opacity-40" />
                          <span>Stream open. Ready to transmit frames.</span>
                        </div>
                      ) : (
                        active.messages.map((m) => <MessageBubble key={m.id} message={m} />)
                      )}
                    </div>

                    {/* Bottom Composer Operations Tray */}
                    <div className="border-t border-[var(--c-1a1a1a)] bg-[var(--c-090909)] p-3 shrink-0">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-secondary select-none">
                          <input 
                            type="checkbox" 
                            checked={composerBinary} 
                            onChange={(e) => setComposerBinary(e.target.checked)} 
                            className="peer hidden" 
                          />
                          <div className="flex h-3.5 w-3.5 items-center justify-center rounded border border-border bg-bg-elevated peer-checked:border-purple-500 peer-checked:bg-purple-600 text-white font-bold text-[8px]">
                            {composerBinary && "✓"}
                          </div>
                          <span className="flex items-center gap-1 text-[11px]">
                            <Binary size={12} className="text-text-muted" /> Transmit as Base64 binary
                          </span>
                        </label>

                        <button 
                          onClick={() => clearMessages(active.id)} 
                          className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
                        >
                          <RotateCcw size={12} /> Reset Console Log
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
                          placeholder={active.status === "open" ? "Enter payload here... (⏎ to send, ⇧⏎ for line break)" : "Connection offline. Connect to server to send messages."}
                          disabled={active.status !== "open"}
                          rows={2}
                          className="flex-1 resize-none rounded border border-[var(--c-262626)] bg-[var(--c-121212)] px-3 py-2 font-mono text-[12px] text-text-primary outline-none placeholder:text-text-muted focus:border-purple-600/80 disabled:opacity-40"
                        />
                        <button
                          onClick={handleSend}
                          disabled={active.status !== "open" || !composer.trim()}
                          className="flex h-[48px] items-center gap-1.5 rounded bg-purple-600 px-4 text-[12px] font-semibold text-white hover:bg-purple-500 disabled:bg-bg-elevated disabled:border disabled:border-[var(--c-222222)] disabled:text-text-muted disabled:opacity-100 transition-colors"
                        >
                          <Send size={13} /> Send
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-text-muted font-mono">
              Select or open a new stream terminal connection to begin.
            </div>
          )}
        </div>
      </div>
    </div>
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
    <div className="p-4 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Handshake Connection Headers</div>
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
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded border border-border bg-bg-elevated peer-checked:border-purple-500 peer-checked:bg-purple-600 text-white font-bold text-[8px]">
                {h.enabled && "✓"}
              </div>
            </label>
            <input 
              value={h.key} 
              onChange={(e) => update(h.id, { key: e.target.value })} 
              placeholder="Header Key (e.g. Authorization)" 
              className="rounded border border-[var(--c-222222)] bg-[var(--c-111111)] px-3 py-1.5 font-mono text-[11px] text-text-primary placeholder:text-text-muted outline-none focus:border-purple-950 focus:bg-[var(--c-141414)]" 
            />
            <input 
              value={h.value} 
              onChange={(e) => update(h.id, { value: e.target.value })} 
              placeholder="Value" 
              className="rounded border border-[var(--c-222222)] bg-[var(--c-111111)] px-3 py-1.5 font-mono text-[11px] text-text-primary placeholder:text-text-muted outline-none focus:border-purple-950 focus:bg-[var(--c-141414)]" 
            />
            <button 
              onClick={() => remove(h.id)} 
              className="flex items-center justify-center h-7 w-7 rounded hover:bg-rose-950/20 text-text-muted hover:text-rose-400 transition-colors"
            >
              <Trash2 size={13} />
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
    if (message.isBinary) return message.data;
    try {
      return JSON.stringify(JSON.parse(message.data), null, 2);
    } catch {
      return message.data;
    }
  })();

  const time = new Date(message.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="w-full border border-[var(--c-181818)] bg-[var(--c-0b0b0b)] rounded overflow-hidden shadow-xs">
      {/* Header Context Control Panel Tray */}
      <div className="flex h-7 items-center justify-between border-b border-[var(--c-161616)] bg-[var(--c-0e0e0e)] px-3">
        <div className="flex items-center gap-2">
          <span className={clsx(
            "rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
            isSent ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"
          )}>
            {isSent ? "→ OUTBOUND" : "← INBOUND"}
          </span>
          {message.isBinary && (
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
              <HardDrive size={10} /> Binary Frame (Base64)
            </span>
          )}
          <span className="font-mono text-[10px] text-text-muted">{time}</span>
        </div>

        {/* Copy Operations */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(message.data);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[10px] text-text-secondary hover:bg-[var(--c-1a1a1a)] hover:text-white transition-colors"
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

      {/* Structured Code Frame Window Container */}
      <div className="p-3 bg-[var(--c-070707)]">
        <pre className="max-h-[220px] overflow-y-auto whitespace-pre-wrap break-all font-mono text-[12px] text-text-secondary selection:bg-purple-900/50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
          {display}
        </pre>
      </div>
    </div>
  );
}