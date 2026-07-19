import { relaunch } from "@tauri-apps/plugin-process";
import type { Update } from "@tauri-apps/plugin-updater";
import { Download, X, RotateCw } from "lucide-react";
import type { UpdateStatus } from "./useAutoUpdate";

interface Props {
  status: UpdateStatus;
  update: Update | null;
  progress: number;
  error: string;
  install: () => void;
  dismiss: () => void;
}

/** Renders on top of everything when an update is available/downloading/ready.
 * Driven by the single shared useAutoUpdate() instance owned by App.tsx —
 * this component owns no update-checking state of its own, so the manual
 * "Check for Updates" button in Settings and this modal always agree. */
export function UpdateModal({ status, update, progress, error, install, dismiss }: Props) {
  if (status === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-[380px] rounded-lg border border-border bg-bg-panel p-5 text-[13px] text-text-primary shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-[14px]">
            {status === "ready" ? "Update ready" : "Update available"}
          </div>
          {status === "available" && (
            <button onClick={dismiss} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        {status === "available" && update && (
          <>
            <p className="text-text-secondary mb-1">
              Version {update.version} is available (you're on {update.currentVersion}).
            </p>
            {update.body && (
              <pre className="whitespace-pre-wrap text-[12px] text-text-muted max-h-32 overflow-y-auto my-3 border border-border rounded p-2">
                {update.body}
              </pre>
            )}
            <button
              onClick={install}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-accent py-2 font-medium text-black hover:opacity-90"
            >
              <Download size={14} /> Update now
            </button>
          </>
        )}

        {status === "downloading" && (
          <div className="space-y-2">
            <p className="text-text-secondary">Downloading update… {progress}%</p>
            <div className="h-1.5 w-full rounded bg-bg-elevated">
              <div className="h-1.5 rounded bg-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {status === "ready" && (
          <>
            <p className="text-text-secondary mb-3">Restart Kairo to finish installing.</p>
            <button
              onClick={() => relaunch()}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-accent py-2 font-medium text-black hover:opacity-90"
            >
              <RotateCw size={14} /> Restart now
            </button>
          </>
        )}

        {status === "error" && <p className="text-status-error text-[12px]">{error}</p>}
      </div>
    </div>
  );
}