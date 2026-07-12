import { useEffect, useState } from "react";
import { X, Play, Square, RotateCcw, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { useCollectionStore } from "@/stores/collectionStore";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { useRunnerStore } from "@/stores/runnerStore";
import { useTabStore } from "@/stores/tabStore";
import { createTabFromRequest } from "@/lib/factories";
import type { ApiRequest } from "@/types";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get", POST: "text-method-post", PUT: "text-method-put",
  PATCH: "text-method-patch", DELETE: "text-method-delete", HEAD: "text-method-head", OPTIONS: "text-method-options",
};

interface Props {
  collectionId: string | null;
  onClose: () => void;
}

export function RunnerModal({ collectionId, onClose }: Props) {
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const collectRequestsRecursive = useCollectionStore((s) => s.collectRequestsRecursive);
  const collections = useCollectionStore((s) => s.collections);
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const { isRunning, results, delayMs, setDelay, run, stop, reset } = useRunnerStore();
  const openTab = useTabStore((s) => s.openTab);

  const collection = collections.find((c) => c.id === collectionId) ?? null;

  useEffect(() => {
    if (!collectionId) return;
    reset();
    setLoadingRequests(true);
    collectRequestsRecursive(collectionId)
      .then(setRequests)
      .finally(() => setLoadingRequests(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId]);

  if (!collectionId) return null;

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed" || r.status === "error").length;
  const done = results.filter((r) => r.status !== "pending" && r.status !== "running").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-[640px] flex-col overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-[15px] font-semibold text-text-primary">Run: {collection?.name ?? "Collection"}</div>
            <div className="text-[12px] text-text-muted">
              {requests.length} request{requests.length === 1 ? "" : "s"}
              {results.length > 0 && ` · ${passed} passed, ${failed} failed, ${done}/${results.length} done`}
            </div>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
          <label className="flex items-center gap-2 text-[12px] text-text-secondary">
            Delay between requests
            <input
              type="number"
              min={0}
              value={delayMs}
              onChange={(e) => setDelay(Math.max(0, Number(e.target.value)))}
              className="w-20 rounded-md border border-border bg-bg-elevated px-2 py-1 text-right text-text-primary focus:border-accent focus:outline-none"
            />
            ms
          </label>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => reset()}
              disabled={isRunning}
              className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-hover disabled:opacity-50"
            >
              <RotateCcw size={13} /> Reset
            </button>
            {isRunning ? (
              <button
                onClick={stop}
                className="flex items-center gap-1.5 rounded-md bg-status-error px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90"
              >
                <Square size={13} /> Stop
              </button>
            ) : (
              <button
                onClick={() => run(requests, activeEnvironmentId)}
                disabled={requests.length === 0 || loadingRequests}
                className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-black hover:bg-accent-hover disabled:opacity-50"
              >
                <Play size={13} /> Run
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingRequests && <div className="p-6 text-center text-text-muted">Loading requests…</div>}
          {!loadingRequests && requests.length === 0 && (
            <div className="p-6 text-center text-text-muted">No requests in this collection</div>
          )}
          {!loadingRequests && requests.map((req, i) => {
            const result = results[i];
            return (
              <button
                key={req.id}
                onClick={() => openTab(createTabFromRequest(req))}
                className="flex w-full items-center gap-2.5 border-b border-border px-4 py-2 text-left hover:bg-bg-hover"
              >
                <span className={`w-14 shrink-0 text-[11px] font-semibold ${METHOD_COLOR[req.method] ?? ""}`}>
                  {req.method}
                </span>
                <span className="flex-1 truncate text-[13px] text-text-secondary">{req.name}</span>
                {result && (
                  <>
                    {result.response && <span className="shrink-0 text-[11px] text-text-muted">{result.response.status}</span>}
                    {result.durationMs > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-[11px] text-text-muted">
                        <Clock size={11} /> {result.durationMs}ms
                      </span>
                    )}
                    <StatusIcon status={result.status} />
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "passed": return <CheckCircle2 size={15} className="shrink-0 text-status-success" />;
    case "failed":
    case "error": return <XCircle size={15} className="shrink-0 text-status-error" />;
    case "running": return <Clock size={15} className="shrink-0 animate-pulse text-accent" />;
    case "skipped": return <AlertTriangle size={15} className="shrink-0 text-text-muted" />;
    default: return <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-border" />;
  }
}