import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import type { HistoryEntry } from "@/types";
import { api } from "@/lib/api";
import { useTabStore } from "@/stores/tabStore";
import { uid } from "@/lib/factories";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

function statusColor(status: number) {
  if (status >= 500) return "text-status-error";
  if (status >= 400) return "text-status-error";
  if (status >= 300) return "text-status-redirect";
  if (status >= 200) return "text-status-success";
  return "text-text-muted";
}

function groupByDate(entries: HistoryEntry[]) {
  const groups: Record<string, HistoryEntry[]> = {};
  for (const e of entries) {
    const d = new Date(e.createdAt);
    const key = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    (groups[key] ??= []).push(e);
  }
  return groups;
}

export function HistoryPanel() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState("");
  const openTab = useTabStore((s) => s.openTab);

  useEffect(() => {
    api.history
      .list(200, 0)
      .then(setEntries)
      .catch(() => setEntries([])); // backend not wired yet in dev preview
  }, []);

  const handleClear = async () => {
    await api.history.clear().catch(() => {});
    setEntries([]);
  };

  const handleClick = (entry: HistoryEntry) => {
    openTab({
      id: uid(),
      requestId: entry.request.id,
      title: entry.request.name || entry.method,
      isUnsaved: false,
      request: entry.request,
      response: entry.response,
      error: null,
      isLoading: false,
    });
  };

  const visible = entries.filter(
    (e) =>
      e.url.toLowerCase().includes(query.toLowerCase()) ||
      e.method.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = groupByDate(visible);

  return (
    <div className="flex h-full flex-col" style={{ fontSize: "var(--font-sidebar)" }}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-medium text-text-primary">History</span>
        <button onClick={handleClear} className="text-[12px] text-text-muted hover:text-accent">
          Clear
        </button>
      </div>

      <div className="border-b border-border p-3">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full rounded-md border border-border bg-bg-elevated py-1.5 pl-7 pr-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(grouped).length === 0 && (
          <div className="mt-6 text-center text-text-muted">No history yet</div>
        )}
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="px-3 py-1.5 text-[12px] text-text-muted">{date}</div>
            {items.map((entry) => (
              <button
                key={entry.id}
                onClick={() => handleClick(entry)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-bg-hover"
              >
                <span className={`w-14 shrink-0 text-[12px] font-semibold ${METHOD_COLOR[entry.method]}`}>
                  {entry.method}
                </span>
                <span className="flex-1 truncate text-text-secondary">{entry.url}</span>
                <span className={`text-[12px] font-medium ${statusColor(entry.status)}`}>
                  {entry.status}
                </span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
