import { useState } from "react";
import { ChevronRight, ChevronDown } from "lucide-react";

interface Props {
  data: unknown;
  path?: string;
  keyName?: string;
  searchQuery?: string;
  depth?: number;
  onKeyClick?: (pathArray: (string | number)[], event: React.MouseEvent) => void;
  pathSegments?: (string | number)[];
}

function valueColor(v: unknown) {
  if (v === null) return "text-text-muted";
  if (typeof v === "string") return "text-method-post"; // orange color for strings
  if (typeof v === "number") return "text-method-put";
  if (typeof v === "boolean") return "text-method-patch";
  return "text-text-primary";
}

function formatPrimitive(v: unknown) {
  if (v === null) return "null";
  if (typeof v === "string") return `"${v}"`;
  return String(v);
}

export function JsonTree({
  data,
  path = "data",
  keyName,
  searchQuery,
  depth = 0,
  onKeyClick,
  pathSegments = [],
}: Props) {
  const [open, setOpen] = useState(depth < 2);
  const isObject = data !== null && typeof data === "object";

  const matches =
    !searchQuery ||
    (keyName ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (!isObject && String(data).toLowerCase().includes(searchQuery.toLowerCase()));

  if (!matches && !isObject) return null;

  // Handle key clicks to calculate accurate path segments array back to top parent hook
  const handleElementClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onKeyClick && keyName !== undefined) {
      onKeyClick(pathSegments, e);
    }
  };

  if (!isObject) {
    return (
      <div className="flex items-center gap-1 rounded py-[1px] pl-4 leading-[1.5] select-text">
        {keyName && (
          <span
            onClick={handleElementClick}
            className="text-status-redirect cursor-pointer hover:underline font-medium"
          >
            {keyName}
          </span>
        )}
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
      <div className="flex items-center gap-1 rounded py-[1px] leading-[1.5]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-text-muted hover:text-text-primary p-0.5 focus:outline-none"
        >
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        </button>

        {keyName && (
          <span
            onClick={handleElementClick}
            className="text-status-redirect cursor-pointer hover:underline font-medium"
          >
            {keyName}
          </span>
        )}
        {keyName && <span className="text-text-muted">:</span>}
        <span className="text-text-muted">{Array.isArray(data) ? "[" : "{"}</span>
        {!open && <span className="text-text-muted">…{Array.isArray(data) ? "]" : "}"}</span>}
      </div>

      {open && (
        <div className="ml-3 border-l border-border pl-2">
          {entries.map(([k, v]) => {
            const nextSegment = Array.isArray(data) ? Number(k) : k;
            return (
              <JsonTree
                key={k}
                data={v}
                path={Array.isArray(data) ? `${path}[${k}]` : `${path}.${k}`}
                keyName={k}
                searchQuery={searchQuery}
                depth={depth + 1}
                onKeyClick={onKeyClick}
                pathSegments={[...pathSegments, nextSegment]}
              />
            );
          })}
        </div>
      )}
      
      {open && (
        <div className="pl-5 leading-[1.5] text-text-muted select-none">
          {Array.isArray(data) ? "]" : "}"}
        </div>
      )}
    </div>
  );
}