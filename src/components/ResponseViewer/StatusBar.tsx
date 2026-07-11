import { Copy, Search } from "lucide-react";
import type { ApiResponse } from "@/types";

function statusColor(status: number) {
  if (status >= 500) return "bg-status-error/15 text-status-error";
  if (status >= 400) return "bg-status-error/15 text-status-error";
  if (status >= 300) return "bg-status-redirect/15 text-status-redirect";
  return "bg-status-success/15 text-status-success";
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

interface Props {
  response: ApiResponse;
  onSearchToggle: () => void;
}

export function StatusBar({ response, onSearchToggle }: Props) {
  return (
    <div className="flex items-center gap-3 border-b border-border px-3 py-2">
      <span className={`rounded px-2 py-0.5 text-[13px] font-semibold ${statusColor(response.status)}`}>
        {response.status}
      </span>
      <span className="text-[13px] text-text-secondary">{response.timing.totalMs} ms</span>
      <span className="text-[13px] text-text-secondary">{formatBytes(response.sizeBytes)}</span>
      <span className="text-[12px] text-text-muted">
        {new Date(response.receivedAt).toLocaleString()}
      </span>
      <div className="ml-auto flex gap-1">
        <button
          onClick={() => navigator.clipboard?.writeText(response.body)}
          className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary"
          title="Copy response"
        >
          <Copy size={15} />
        </button>
        <button
          onClick={onSearchToggle}
          className="rounded p-1.5 text-text-muted hover:bg-bg-hover hover:text-text-primary"
          title="Search response"
        >
          <Search size={15} />
        </button>
      </div>
    </div>
  );
}
