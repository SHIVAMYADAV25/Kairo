import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, Plus, Play, Square, Trash2 } from "lucide-react";
import { useMockStore, type MockRoute, type MockHeader } from "@/stores/mockStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get", POST: "text-method-post", PUT: "text-method-put",
  PATCH: "text-method-patch", DELETE: "text-method-delete", HEAD: "text-method-head", OPTIONS: "text-method-options",
};

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex h-[80vh] w-[1150px] max-w-full overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main column */}
        <div className="flex min-w-0 flex-[2.3] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-[19px] font-semibold text-text-primary">Mock Server</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X size={20} />
            </button>
          </div>

          <div className="border-b border-border px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-text-secondary">Port:</span>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                disabled={running}
                className="w-24 rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-text-primary focus:border-accent focus:outline-none disabled:opacity-60"
              />
              <button
                onClick={handleToggle}
                disabled={starting}
                className={clsx(
                  "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-[13px] font-medium disabled:opacity-60",
                  running ? "bg-status-error text-white hover:opacity-90" : "bg-accent text-black hover:bg-accent-hover"
                )}
              >
                {running ? <Square size={13} /> : <Play size={13} />}
                {running ? "Stop" : "Start"}
              </button>
              {running && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-status-success">
                  <span className="h-2 w-2 rounded-full bg-status-success" /> Running
                </span>
              )}
            </div>
            {error && <div className="mt-2 text-[12px] text-status-error">{error}</div>}
            {running && (
              <div className="mt-2 text-[12px] text-text-muted">
                Base URL:{" "}
                <span className="font-mono font-semibold text-text-primary">http://localhost:{port}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-5 pb-2 pt-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-text-muted">Routes</span>
            <button
              onClick={() => setFormOpen("new")}
              className="flex items-center gap-1 text-[13px] font-medium text-accent hover:opacity-80"
            >
              <Plus size={14} /> Add Route
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <div className="overflow-hidden rounded-md border border-border">
              {routes.length === 0 ? (
                <div className="p-6 text-center text-text-muted">No routes yet — click "Add Route"</div>
              ) : (
                routes.map((r) => (
                  <RouteRow
                    key={r.id}
                    route={r}
                    onEdit={() => setFormOpen(r.id)}
                    onToggle={(enabled) => updateRoute(r.id, { enabled })}
                    onDelete={() => deleteRoute(r.id)}
                  />
                ))
              )}
            </div>

            {(formOpen === "new" || editingRoute) && (
              <RouteForm
                initial={editingRoute}
                onCancel={() => setFormOpen(null)}
                onSave={(data) => {
                  if (editingRoute) updateRoute(editingRoute.id, data);
                  else addRoute(data);
                  setFormOpen(null);
                }}
              />
            )}
          </div>
        </div>

        {/* Request log column */}
        <div className="flex w-[340px] shrink-0 flex-col border-l border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <span className="text-[13px] font-bold uppercase tracking-widest text-text-muted">Request Log</span>
            {log.length > 0 && (
              <button onClick={clearLog} className="text-[12px] text-text-muted hover:text-text-primary">
                Clear
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {log.length === 0 ? (
              <div className="flex h-full items-center justify-center px-4 text-center text-text-muted">
                Start the server to see requests here.
              </div>
            ) : (
              <div className="space-y-2">
                {log.map((entry) => {
                  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour12: false });
                  const ok = entry.status >= 200 && entry.status < 400;
                  return (
                    <div key={entry.id} className="rounded-md border border-border px-3 py-2 text-[12px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-text-muted">{time}</span>
                        <span className={clsx("font-semibold", METHOD_COLOR[entry.method] ?? "")}>{entry.method}</span>
                        <span className="truncate font-mono text-text-secondary">{entry.path}</span>
                      </div>
                      <div className={clsx("mt-0.5 pl-[52px] font-mono", ok ? "text-status-success" : "text-status-error")}>
                        → {entry.status} <span className="text-text-muted">({entry.durationMs}ms)</span>
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
    <div className="flex items-center gap-3 border-b border-border px-3 py-2.5 last:border-b-0 hover:bg-bg-hover">
      <button onClick={onEdit} className="flex flex-1 items-center gap-3 text-left">
        <span className={clsx("w-14 shrink-0 text-[12px] font-semibold", METHOD_COLOR[route.method] ?? "")}>{route.method}</span>
        <span className="truncate font-mono text-[13px] text-text-primary">{route.path}</span>
      </button>
      <span className="text-[12px] text-text-muted">{route.status}</span>
      <button
        onClick={() => onToggle(!route.enabled)}
        className={clsx(
          "flex h-5 w-5 items-center justify-center rounded",
          route.enabled ? "bg-accent text-black" : "border border-border text-transparent"
        )}
        title={route.enabled ? "Enabled" : "Disabled"}
      >
        ✓
      </button>
      <button onClick={onDelete} className="text-text-muted hover:text-status-error">
        <X size={15} />
      </button>
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
      setHeadersError(e instanceof Error ? e.message : "Invalid JSON");
      return;
    }
    setHeadersError(null);
    onSave({ method, path, status, delayMs, enabled: initial?.enabled ?? true, description, responseBody, responseHeaders });
  };

  return (
    <div className="mt-3 rounded-md border border-border bg-bg-elevated p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-text-primary">{initial ? "Edit Route" : "New Route"}</span>
        <button onClick={onCancel} className="text-text-muted hover:text-text-primary">
          <X size={16} />
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-[110px] rounded-md border border-border bg-bg-panel px-2.5 py-2 text-text-primary focus:border-accent focus:outline-none">
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/users/:id" className="flex-1 rounded-md border border-border bg-bg-panel px-3 py-2 font-mono text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
        <input type="number" value={status} onChange={(e) => setStatus(Number(e.target.value))} className="w-24 rounded-md border border-border bg-bg-panel px-3 py-2 text-text-primary focus:border-accent focus:outline-none" />
        <input type="number" value={delayMs} onChange={(e) => setDelayMs(Number(e.target.value))} title="Delay (ms)" className="w-24 rounded-md border border-border bg-bg-panel px-3 py-2 text-text-primary focus:border-accent focus:outline-none" />
      </div>

      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="mb-3 w-full rounded-md border border-border bg-bg-panel px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
      />

      <div className="mb-1 text-[13px] text-text-secondary">Response Body</div>
      <textarea
        value={responseBody}
        onChange={(e) => setResponseBody(e.target.value)}
        rows={4}
        className="mb-1 w-full resize-y rounded-md border border-border bg-bg-panel px-3 py-2 font-mono text-[12.5px] text-text-primary outline-none focus:border-accent"
      />
      <div className="mb-3 text-[11px] text-text-muted">
        Template variables: <code className="text-accent">{"{{$uuid}}"}</code> <code className="text-accent">{"{{$timestamp}}"}</code>{" "}
        <code className="text-accent">{"{{$isoTimestamp}}"}</code> <code className="text-accent">{"{{$randomInt}}"}</code>{" "}
        <code className="text-accent">{"{{$randomInt(min,max)}}"}</code> <code className="text-accent">{"{{$randomFloat}}"}</code>{" "}
        <code className="text-accent">{"{{$randomBool}}"}</code> <code className="text-accent">{"{{$randomString}}"}</code>{" "}
        <code className="text-accent">{"{{$randomEmail}}"}</code>
      </div>

      <div className="mb-1 text-[13px] text-text-secondary">Response Headers (JSON array)</div>
      <textarea
        value={headersRaw}
        onChange={(e) => setHeadersRaw(e.target.value)}
        rows={2}
        className="mb-1 w-full resize-y rounded-md border border-border bg-bg-panel px-3 py-2 font-mono text-[12.5px] text-text-primary outline-none focus:border-accent"
      />
      {headersError && <div className="mb-2 text-[12px] text-status-error">{headersError}</div>}

      <div className="mt-3 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md px-4 py-1.5 text-[13px] text-text-secondary hover:bg-bg-hover">
          Cancel
        </button>
        <button onClick={handleSave} className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover">
          {initial ? "Save Route" : "Create Route"}
        </button>
      </div>
    </div>
  );
}