import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: (curl: string) => "ok" | "invalid";
}

/** In-app replacement for `prompt("Paste your cURL command:")`. A single-line
 * native prompt was always a poor fit for multi-line cURL commands anyway —
 * this uses a textarea and shows inline validation instead of a follow-up
 * alert() popup. */
export function CurlImportModal({ open, onCancel, onConfirm }: Props) {
  const [value, setValue] = useState("");
  const [invalid, setInvalid] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setInvalid(false);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }, [open]);

  if (!open) return null;

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const result = onConfirm(trimmed);
    setInvalid(result === "invalid");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50" onClick={onCancel}>
      <div
        className="w-[520px] rounded-lg border border-border bg-bg-panel p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-[14px] font-semibold text-text-primary">Import cURL</h3>
        <label className="mb-1 block text-[11px] uppercase tracking-wide text-text-muted">cURL command</label>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (invalid) setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onCancel();
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          placeholder={`curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -d '{"name":"Ada"}'`}
          rows={6}
          className="w-full resize-y rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[12.5px] text-text-primary placeholder:text-text-muted outline-none focus:border-accent"
        />
        {invalid && (
          <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-status-error">
            <AlertCircle size={14} /> That doesn't look like a valid cURL command — check it and try again.
          </div>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-border px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-hover"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </div>
    </div>
  );
}