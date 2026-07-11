import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  data: unknown;
  path?: string;
  keyName?: string;
  searchQuery?: string;
  depth?: number;
}

function copyPath(path: string) {
  navigator.clipboard?.writeText(path).catch(() => {});
}

function valueColor(v: unknown) {
  if (v === null) return "text-text-muted";
  if (typeof v === "string") return "text-method-post"; // orange-ish for strings, like screenshot
  if (typeof v === "number") return "text-method-put";
  if (typeof v === "boolean") return "text-method-patch";
  return "text-text-primary";
}

function formatPrimitive(v: unknown) {
  if (v === null) return "null";
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}

export function JsonTree({ data, path = "data", keyName, searchQuery, depth = 0 }: Props) {
  const [open, setOpen] = useState(depth < 2);
  const isObject = data !== null && typeof data === "object";
  const matches =
    !searchQuery ||
    (keyName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (!isObject && String(data).toLowerCase().includes(searchQuery.toLowerCase()));

  if (!matches && !isObject) return null;

  if (!isObject) {
    return (
      <div
        className="flex cursor-pointer items-center gap-1 py-0.5 pl-4 hover:bg-bg-hover"
        onClick={() => copyPath(path)}
        title={`Copy JS path: ${path}`}
      >
        {keyName && <span className="text-status-redirect">{keyName}</span>}
        {keyName && <span className="text-text-muted">:</span>}
        <span className={valueColor(data)}>{formatPrimitive(data)}</span>
      </div>
    );
  }

  const entries = Array.isArray(data)
    ? data.map((v, i) => [String(i), v] as const)
    : Object.entries(data as Record<string, unknown>);

  return (
    <div>
      <div
        className="flex cursor-pointer items-center gap-1 py-0.5 hover:bg-bg-hover"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        {keyName && <span className="text-status-redirect">{keyName}</span>}
        {keyName && <span className="text-text-muted">:</span>}
        <span className="text-text-muted">{Array.isArray(data) ? "[" : "{"}</span>
        {!open && <span className="text-text-muted">…{Array.isArray(data) ? "]" : "}"}</span>}
      </div>
      {open && (
        <div className="ml-3 border-l border-border pl-2">
          {entries.map(([k, v]) => (
            <JsonTree
              key={k}
              data={v}
              path={Array.isArray(data) ? `${path}[${k}]` : `${path}.${k}`}
              keyName={k}
              searchQuery={searchQuery}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
      {open && (
        <div className="pl-4 text-text-muted">{Array.isArray(data) ? "]" : "}"}</div>
      )}
    </div>
  );
}
