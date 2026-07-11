import { Trash2, FileText, Type as TypeIcon, FolderOpen } from "lucide-react";
import clsx from "clsx";
import type { FormDataField } from "@/types";
import { uid } from "@/lib/factories";

interface Props {
  rows: FormDataField[];
  onChange: (rows: FormDataField[]) => void;
}

/**
 * Working Form Data editor (fix #5). Mirrors KeyValueTable's row layout so it
 * reads as one consistent design language, but adds a per-row Text/File type
 * toggle: text rows behave like a normal value input, file rows open the
 * native file picker (falling back to a browser file input when the Tauri
 * dialog plugin isn't available, e.g. in a plain browser preview) and store
 * the resolved path/name that the Rust side turns into a multipart part.
 */
export function FormDataTable({ rows, onChange }: Props) {
  const withTrailingBlank: FormDataField[] =
    rows.length === 0 || rows[rows.length - 1].key !== ""
      ? [...rows, { id: uid(), key: "", type: "text", value: "", enabled: true }]
      : rows;

  const update = (id: string, patch: Partial<FormDataField>) => {
    const next = withTrailingBlank.map((r) => (r.id === id ? { ...r, ...patch } : r));
    onChange(next.filter((r, i) => r.key !== "" || i === next.length - 1));
  };

  const remove = (id: string) => onChange(withTrailingBlank.filter((r) => r.id !== id));

  const pickFile = async (id: string) => {
    try {
      // Dynamic import so this file works even if the dialog plugin isn't
      // registered yet (e.g. first run before native perms settle).
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ multiple: false, directory: false });
      if (typeof selected === "string") {
        update(id, { value: selected });
      }
    } catch {
      // Fall back to a hidden <input type="file"> click when running outside
      // a Tauri webview (e.g. `vite dev` in a plain browser tab).
      const input = document.getElementById(`formdata-file-${id}`) as HTMLInputElement | null;
      input?.click();
    }
  };

  return (
    <div className="text-[13px]" style={{ fontSize: "var(--font-request)" }}>
      <div className="grid grid-cols-[24px_90px_1fr_1fr_32px] gap-2 px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#312C22]">
        <span />
        <span className="pl-1">Type</span>
        <span className="pl-3">Key</span>
        <span className="pl-3">Value</span>
        <span />
      </div>

      <div className="space-y-1.5">
        {withTrailingBlank.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[24px_90px_1fr_1fr_32px] items-center gap-2 px-3 py-0.5"
          >
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, { enabled: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-none bg-bg-panel accent-[#f97316] checked:bg-[#f97316]"
            />

            {/* Per-row Text/File toggle */}
            <div className="flex overflow-hidden rounded-md border border-[#262626]">
              <button
                type="button"
                title="Text field"
                onClick={() => update(row.id, { type: "text", value: row.type === "file" ? "" : row.value })}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] transition-colors",
                  row.type === "text" ? "bg-[#F54900] text-white" : "bg-[#111111] text-[#a3a3a3] hover:bg-[#1c1c1c]"
                )}
              >
                <TypeIcon size={11} /> Text
              </button>
              <button
                type="button"
                title="File field"
                onClick={() => update(row.id, { type: "file", value: row.type === "text" ? "" : row.value })}
                className={clsx(
                  "flex flex-1 items-center justify-center gap-1 py-1.5 text-[11px] transition-colors",
                  row.type === "file" ? "bg-[#F54900] text-white" : "bg-[#111111] text-[#a3a3a3] hover:bg-[#1c1c1c]"
                )}
              >
                <FileText size={11} /> File
              </button>
            </div>

            <input
              value={row.key}
              onChange={(e) => update(row.id, { key: e.target.value })}
              placeholder="Key"
              className="w-full rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none transition-colors focus:bg-[#161616]"
            />

            {row.type === "file" ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => pickFile(row.id)}
                  className="flex w-full items-center gap-2 truncate rounded-md border-none bg-[#111111] px-3 py-2 text-left text-text-secondary outline-none transition-colors hover:bg-[#161616]"
                >
                  <FolderOpen size={14} className="shrink-0 text-text-muted" />
                  <span className="truncate">{row.value || "Select a file…"}</span>
                </button>
                {/* Browser-only fallback input, hidden; used if the Tauri dialog import fails. */}
                <input
                  id={`formdata-file-${row.id}`}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) update(row.id, { value: (f as any).path ?? f.name });
                  }}
                />
              </div>
            ) : (
              <input
                value={row.value}
                onChange={(e) => update(row.id, { value: e.target.value })}
                placeholder="Value"
                className="w-full rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none transition-colors focus:bg-[#161616]"
              />
            )}

            <button
              onClick={() => remove(row.id)}
              className="flex items-center justify-center text-text-muted/40 transition-colors hover:text-status-error"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          onChange([...rows, { id: uid(), key: "", type: "text", value: "", enabled: true }])
        }
        className="ml-3 mt-2 text-[12px] font-medium text-accent hover:text-accent-hover"
      >
        + Add field
      </button>
    </div>
  );
}
