import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** In-app replacement for window.confirm(). Native confirm() dialogs render
 * as a browser/webview-chrome popup prefixed with the page origin (e.g.
 * "localhost:1420 says") which looks broken inside a desktop app — this
 * matches the app's own styling instead. */
export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = true,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="w-[380px] rounded-lg border border-border bg-bg-panel p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start gap-2.5">
          {danger && <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-error" />}
          <div>
            <h3 className="text-[14px] font-semibold text-text-primary">{title}</h3>
            <p className="mt-1 text-[12.5px] text-text-secondary">{message}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-hover"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? "rounded-md bg-status-error px-3 py-1.5 text-[13px] font-medium text-white hover:opacity-90"
                : "rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}