import { Trash2, FolderOpen } from "lucide-react";
import clsx from "clsx";
import type { FormDataField } from "@/types";
import { uid } from "@/lib/factories";

interface Props {
  rows: FormDataField[];
  onChange: (rows: FormDataField[]) => void;
}

export function FormDataTable({ rows, onChange }: Props) {
  // Ensure a trailing blank line is present for new entries
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
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ multiple: false, directory: false });
      if (typeof selected === "string") {
        update(id, { value: selected });
      }
    } catch {
      const input = document.getElementById(`formdata-file-${id}`) as HTMLInputElement | null;
      input?.click();
    }
  };

  return (
    <div className="w-full text-[13px] px-1 py-2 select-none">
      <div className="space-y-2">
        {withTrailingBlank.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-3 py-0.5 group"
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, { enabled: e.target.checked })}
              className="h-3.5 w-3.5 cursor-pointer rounded border border-neutral-700 bg-transparent accent-[#f97316] checked:bg-[#f97316] outline-none"
            />

            {/* Clean Dropdown Selector for Text/File */}
            <div className="relative shrink-0">
              <select
                value={row.type}
                onChange={(e) => update(row.id, { type: e.target.value as "text" | "file", value: "" })}
                className="appearance-none bg-[var(--c-1a1a1a)] text-neutral-300 border border-neutral-800 rounded px-2.5 py-1.5 text-[12px] font-medium tracking-wide cursor-pointer outline-none hover:bg-[var(--c-222222)] transition-colors pr-6"
              >
                <option value="text">Text</option>
                <option value="file">File</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-neutral-500">
                <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>

            {/* Key Input */}
            <input
              value={row.key}
              onChange={(e) => update(row.id, { key: e.target.value })}
              placeholder="Key"
              className="w-1/3 bg-[var(--c-141414)] border border-neutral-900 rounded px-3 py-1.5 text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-800 focus:bg-[var(--c-161616)] transition-all"
            />

            {/* Value Input / File Picker */}
            {row.type === "file" ? (
              <div className="flex-1 flex items-center min-w-0">
                <button
                  type="button"
                  onClick={() => pickFile(row.id)}
                  className="flex-1 flex items-center gap-2 bg-[var(--c-141414)] border border-neutral-900 rounded px-3 py-1.5 text-left text-neutral-400 outline-none hover:bg-[var(--c-161616)] transition-all truncate"
                >
                  <FolderOpen size={14} className="shrink-0 text-neutral-500" />
                  <span className="truncate text-[13px]">{row.value || "Value"}</span>
                </button>
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
                className="flex-1 bg-[var(--c-141414)] border border-neutral-900 rounded px-3 py-1.5 text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-neutral-800 focus:bg-[var(--c-161616)] transition-all"
              />
            )}

            {/* Delete button (Visible on hover or when row has content) */}
            <button
              type="button"
              onClick={() => remove(row.id)}
              className={clsx(
                "flex items-center justify-center text-neutral-600 transition-colors hover:text-red-500 p-1.5",
                row.key === "" && "opacity-0 group-hover:opacity-100 transition-opacity"
              )}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Add Field Button */}
      <button
        type="button"
        onClick={() =>
          onChange([...rows, { id: uid(), key: "", type: "text", value: "", enabled: true }])
        }
        className="mt-3 text-[12px] font-medium text-[#f97316] hover:text-[#ea580c] transition-colors flex items-center gap-1 pl-6"
      >
        + Add field
      </button>
    </div>
  );
}