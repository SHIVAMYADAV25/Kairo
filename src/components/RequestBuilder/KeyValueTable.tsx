import { Trash2 } from "lucide-react";
import type { KeyValuePair } from "@/types";
import { uid } from "@/lib/factories";

interface Props {
  rows: KeyValuePair[];
  onChange: (rows: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  keySuggestions?: string[];
}

export function KeyValueTable({ rows, onChange, keyPlaceholder = "Key", keySuggestions }: Props) {
  const withTrailingBlank: KeyValuePair[] =
    rows.length === 0 || rows[rows.length - 1].key !== ""
      ? [...rows, { id: uid(), key: "", value: "", description: "", enabled: true }]
      : rows;

  const update = (id: string, patch: Partial<KeyValuePair>) => {
    const next = withTrailingBlank.map((r) => (r.id === id ? { ...r, ...patch } : r));
    onChange(next.filter((r, i) => r.key !== "" || i === next.length - 1));
  };

  const remove = (id: string) => onChange(withTrailingBlank.filter((r) => r.id !== id));

  const listId = `suggest-${Math.random().toString(36).slice(2)}`;

  return (
    <div className="text-[13px]" style={{ fontSize: "var(--font-request)" }}>
      {keySuggestions && (
        <datalist id={listId}>
          {keySuggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}

      {/* Table Headers aligned with the new input indentation */}
      <div className="grid grid-cols-[24px_1fr_1fr_1fr_32px] gap-2 px-3 pt-4 pb-1 text-[11px] font-medium uppercase tracking-wider text-[#312C22]">
        <span />
        <span className="pl-3">Key</span>
        <span className="pl-3">Value</span>
        <span className="pl-3">Description</span>
        <span />
      </div>

      {/* Input Rows Layout */}
      <div className="space-y-1.5">
        {withTrailingBlank.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-[24px_1fr_1fr_1fr_32px] items-center gap-2 px-3 py-0.5"
          >
            {/* Styled Orange Checkbox */}
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, { enabled: e.target.checked })}
              className="h-4 w-4 cursor-pointer rounded border-none bg-bg-panel accent-[#f97316] checked:bg-[#f97316]"
            />

            {/* Inputs configured with flat background and no borders */}
            <input
              value={row.key}
              list={keySuggestions ? listId : undefined}
              onChange={(e) => update(row.id, { key: e.target.value })}
              placeholder={keyPlaceholder}
              className="w-full rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none transition-colors focus:bg-[#161616]"
            />

            <input
              value={row.value}
              onChange={(e) => update(row.id, { value: e.target.value })}
              placeholder="Value"
              className="w-full rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none transition-colors focus:bg-[#161616]"
            />

            <input
              value={row.description ?? ""}
              onChange={(e) => update(row.id, { description: e.target.value })}
              placeholder="Description"
              className="w-full rounded-md border border-[#161616] bg-[#0A0A0A] px-3 py-2 text-text-primary font-normal placeholder:text-[#424040] outline-none transition-colors focus:bg-[#161616]"
            />

            {/* Trash button element logic left completely untouched */}
            <button
              onClick={() => remove(row.id)}
              className="flex items-center justify-center text-text-muted/40 transition-colors hover:text-status-error"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}