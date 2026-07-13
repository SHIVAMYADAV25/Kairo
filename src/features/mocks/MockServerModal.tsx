import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, Plus } from "lucide-react";
import { useMockStore, type MockRoute, type MockHeader } from "@/stores/mockStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

const METHOD_COLOR: Record<string, string> = {
  GET: "text-[#00ca54]",
  POST: "text-[#ffb700]",
  PUT: "text-[#0091ff]",
  PATCH: "text-[#0091ff]",
  DELETE: "text-[#ff3b30]",
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function MockServerModal({ open, onClose }: Props) {
  const { routes, running, port, log, ensureListeners, addRoute, updateRoute, deleteRoute, setPort, start, stop, clearLog } = useMockStore();
  const [formOpen, setFormOpen] = useState<null | "new" | string>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) ensureListeners();
  }, [open, ensureListeners]);

  if (!open) return null;

  const handleToggle = async () => {
    setError(null);
    setStarting(true);
    try {
      if (running) await stop();
      else await start();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStarting(false);
    }
  };

  const editingRoute = formOpen && formOpen !== "new" ? routes.find((r) => r.id === formOpen) ?? null : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans text-[12px] select-none" onClick={onClose}>
      <div
        className="flex h-[640px] w-[960px] max-w-full overflow-hidden rounded-md border border-[#1b1b1b] bg-[#0f0f0f] text-[#ffffff] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= LEFT CONTROLS & FORM SECTION ================= */}
        <div className="flex flex-1 flex-col overflow-y-auto p-5 border-r border-[#1b1b1b]">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-medium text-white">Mock Server</h2>
            <button onClick={onClose} className="text-[#555555] hover:text-[#aaaaaa] transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Port and Action Setup Block */}
          <div className="flex flex-col gap-1.5 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[#7f7f7f]">Port:</span>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                disabled={running}
                className="w-[75px] h-[28px] px-2.5 bg-[#1a1a1a] border border-[#262626] rounded text-white font-mono text-[12px] outline-none"
              />
              
              <button
                onClick={handleToggle}
                disabled={starting}
                className={clsx(
                  "flex items-center justify-center gap-2 h-[28px] rounded px-4 text-[12px] font-medium text-white transition-colors",
                  running ? "bg-[#e1001c] hover:bg-[#c80018]" : "bg-[#ff5500] hover:bg-[#e04b00]"
                )}
              >
                {running ? (
                  <>
                    <span className="h-2 w-2 bg-white rounded-xs" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <span className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[6px] border-l-white" />
                    <span>Start</span>
                  </>
                )}
              </button>

              {running && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#00ca54] ml-1">
                  <span className="h-2 w-2 rounded-full bg-[#00ca54]" /> Running
                </span>
              )}
            </div>
            
            {error && <div className="text-[11px] text-[#ff3b30] mt-0.5">{error}</div>}
            
            {running && (
              <div className="text-[11px] text-[#7f7f7f] font-sans mt-1.5">
                Base URL: <span className="text-[#a5a5a5] font-mono select-all">http://localhost:{port}</span>
              </div>
            )}
          </div>

          {/* Dynamic Routes Header Area */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">Routes</span>
            <button
              onClick={() => setFormOpen("new")}
              className="flex items-center gap-1 text-[12px] text-[#a5a5a5] hover:text-white transition-colors font-medium"
            >
              <Plus size={14} /> Add Route
            </button>
          </div>

          {/* Sequential vertical layout stack */}
          <div className="space-y-2">
            {/* Embedded Active Route Rows */}
            {routes.length > 0 && (
              <div className="border border-[#1a1a1a] rounded bg-[#0b0b0b] divide-y divide-[#161616]">
                {routes.map((r) => (
                  <RouteRow
                    key={r.id}
                    route={r}
                    onEdit={() => setFormOpen(r.id)}
                    onToggle={(enabled) => updateRoute(r.id, { enabled })}
                    onDelete={() => deleteRoute(r.id)}
                  />
                ))}
              </div>
            )}

            {/* Nested Inline Creation/Edit Blueprint Form Panel */}
            {(formOpen === "new" || editingRoute) && (
              <div className="border border-[#222] bg-[#121212] rounded p-4 mt-2 shadow-inner">
                <RouteForm
                  initial={editingRoute}
                  onCancel={() => setFormOpen(null)}
                  onSave={(data) => {
                    if (editingRoute) updateRoute(editingRoute.id, data);
                    else addRoute(data);
                    setFormOpen(null);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDEBAR REQUEST LOG ================= */}
        <div className="flex w-[300px] shrink-0 flex-col bg-[#0b0b0b] p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">Request Log</span>
            {log.length > 0 && (
              <button onClick={clearLog} className="text-[11px] text-[#666666] hover:text-[#aaaaaa] transition-colors">
                Clear
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto rounded border border-[#1a1a1a] bg-[#070707] p-3">
            {log.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-[#444444] font-sans text-[12px]">
                Waiting for requests...
              </div>
            ) : (
              <div className="space-y-3">
                {log.map((entry) => {
                  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const isOk = entry.status >= 200 && entry.status < 400;
                  return (
                    <div key={entry.id} className="text-[11px] font-mono border-b border-[#141414] pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[#555555] text-[10px]">{time}</span>
                        <span className={clsx("font-bold text-[10px]", METHOD_COLOR[entry.method] ?? "")}>{entry.method}</span>
                        <span className="truncate text-[#cccccc] font-medium">{entry.path}</span>
                      </div>
                      <div className={clsx("pl-12 mt-0.5 font-semibold text-[10px]", isOk ? "text-[#00ca54]" : "text-[#ff3b30]")}>
                        → {entry.status} <span className="text-[#444444] font-normal text-[9px]">({entry.durationMs}ms)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RouteRow({ route, onEdit, onToggle, onDelete }: { route: MockRoute; onEdit: () => void; onToggle: (enabled: boolean) => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-[#131313] transition-colors group">
      <button onClick={onEdit} className="flex flex-1 items-center gap-3 text-left font-mono text-[12px]">
        <span className={clsx("w-10 shrink-0 font-bold text-[11px]", METHOD_COLOR[route.method] ?? "")}>{route.method}</span>
        <span className="truncate text-[#dddddd] font-medium">{route.path}</span>
      </button>
      
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] text-[#666666] font-medium">{route.status}</span>
        <input 
          type="checkbox" 
          checked={route.enabled} 
          onChange={() => onToggle(!route.enabled)}
          className="mock-custom-checkbox" 
        />
        <button onClick={onDelete} className="text-[#444444] hover:text-[#ff3b30] transition-colors opacity-40 group-hover:opacity-100">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function RouteForm({ initial, onCancel, onSave }: { initial: MockRoute | null; onCancel: () => void; onSave: (data: Omit<MockRoute, "id">) => void }) {
  const [method, setMethod] = useState(initial?.method ?? "GET");
  const [path, setPath] = useState(initial?.path ?? "/");
  const [status, setStatus] = useState(initial?.status ?? 200);
  const [delayMs, setDelayMs] = useState(initial?.delayMs ?? 0);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [responseBody, setResponseBody] = useState(initial?.responseBody ?? '{"message": "Hello", "id": "{{$uuid}}"}');
  const [headersRaw, setHeadersRaw] = useState(initial ? JSON.stringify(initial.responseHeaders) : '[{"key": "X-Custom", "value": "header-value"}]');
  const [headersError, setHeadersError] = useState<string | null>(null);

  const handleSave = () => {
    let responseHeaders: MockHeader[] = [];
    try {
      const parsed = headersRaw.trim() ? JSON.parse(headersRaw) : [];
      if (!Array.isArray(parsed)) throw new Error("must be a JSON array");
      responseHeaders = parsed.map((h: any) => ({ key: String(h.key ?? ""), value: String(h.value ?? "") })).filter((h) => h.key);
    } catch (e) {
      setHeadersError(e instanceof Error ? e.message : "Invalid JSON array");
      return;
    }
    setHeadersError(null);
    onSave({ method, path, status, delayMs, enabled: initial?.enabled ?? true, description, responseBody, responseHeaders });
  };

  return (
    <div className="text-[12px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-white text-[12px]">{initial ? "Edit Route" : "New Route"}</span>
        <button onClick={onCancel} className="text-[#555555] hover:text-[#aaaaaa] transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Main Parameters input line alignment */}
      <div className="mb-2.5 flex gap-2">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-[85px] h-[28px] px-2 bg-[#1a1a1a] border border-[#262626] rounded text-white font-medium outline-none">
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        
        <input 
          value={path} 
          onChange={(e) => setPath(e.target.value)} 
          placeholder="/" 
          className="flex-1 h-[28px] px-3 bg-[#1a1a1a] border border-[#262626] rounded text-white font-mono text-[12px] outline-none placeholder:text-[#444444]" 
        />
        
        <input 
          type="number" 
          value={status} 
          onChange={(e) => setStatus(Number(e.target.value))} 
          className="w-16 h-[28px] text-center bg-[#1a1a1a] border border-[#262626] rounded text-white font-mono outline-none" 
          placeholder="200"
        />
        
        <input 
          type="number" 
          value={delayMs} 
          onChange={(e) => setDelayMs(Number(e.target.value))} 
          className="w-16 h-[28px] text-center bg-[#1a1a1a] border border-[#262626] rounded text-white font-mono outline-none" 
          placeholder="0"
        />
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="mb-3 w-full h-[28px] px-3 bg-[#1a1a1a] border border-[#262626] rounded text-white outline-none placeholder:text-[#444444]"
      />

      <div className="mb-1 text-[#7f7f7f] text-[11px] font-medium">Response Body</div>
      <textarea
        value={responseBody}
        onChange={(e) => setResponseBody(e.target.value)}
        rows={4}
        className="w-full resize-none p-2.5 bg-[#1a1a1a] border border-[#262626] rounded text-white font-mono text-[12px] outline-none"
      />
      
      {/* Dynamic string formatting description footer line */}
      <div className="mb-3 font-mono text-[10px] text-[#555555] leading-relaxed">
        Template variables: <span className="text-[#6b6b6b]">{"{{$uuid}} {{$timestamp}} {{$isoTimestamp}} {{$randomInt}} {{$randomInt(min,max)}} {{$randomFloat}} {{$randomBool}} {{$randomString}} {{$randomEmail}}"}</span>
      </div>

      <div className="mb-1 text-[#7f7f7f] text-[11px] font-medium">Response Headers (JSON array)</div>
      <textarea
        value={headersRaw}
        onChange={(e) => setHeadersRaw(e.target.value)}
        rows={2}
        className="w-full resize-none p-2.5 bg-[#1a1a1a] border border-[#262626] rounded text-white font-mono text-[12px] outline-none"
      />
      {headersError && <div className="text-[11px] text-[#ff3b30] mt-1">{headersError}</div>}

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded px-3 py-1.5 text-[#aaaaaa] hover:bg-[#1c1c1c] transition-colors">
          Cancel
        </button>
        <button onClick={handleSave} className="rounded bg-[#ff5500] px-4 py-1.5 font-semibold text-white hover:bg-[#e04b00] transition-colors">
          {initial ? "Save Route" : "Create Route"}
        </button>
      </div>
    </div>
  );
}