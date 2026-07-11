import { useState } from "react";
import { Search, Plus, Globe, ChevronRight, ChevronDown, Download } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { createEmptyTab } from "@/lib/factories";

// Placeholder shape until wired to `api.collections.list()` + `api.requests.listByCollection()`
interface TreeRequest {
  id: string;
  name: string;
  method: string;
}
interface TreeCollection {
  id: string;
  name: string;
  requests: TreeRequest[];
}

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
};

export function CollectionsPanel() {
  const [query, setQuery] = useState("");
  const [collections, setCollections] = useState<TreeCollection[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const openTab = useTabStore((s) => s.openTab);

  const toggle = (id: string) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const handleNewCollection = () => {
    const name = window.prompt("Collection name");
    if (!name) return;
    setCollections((c) => [...c, { id: crypto.randomUUID(), name, requests: [] }]);
  };

  const filtered = collections.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col" style={{ fontSize: "var(--font-sidebar)" }}>
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections"
            className="w-full rounded-md border border-border bg-bg-elevated py-1.5 pl-7 pr-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <button
          onClick={handleNewCollection}
          className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
          title="New Collection"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="mt-6 text-center text-text-muted">No collections yet</div>
        ) : (
          filtered.map((c) => (
            <div key={c.id} className="mb-1">
              <button
                onClick={() => toggle(c.id)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-text-primary hover:bg-bg-hover"
              >
                {expanded[c.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span className="truncate">{c.name}</span>
              </button>
              {expanded[c.id] && (
                <div className="ml-4 border-l border-border pl-2">
                  {c.requests.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => openTab(createEmptyTab())}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left hover:bg-bg-hover"
                    >
                      <span className={`w-10 shrink-0 text-[11px] font-semibold ${METHOD_COLOR[r.method] ?? ""}`}>
                        {r.method}
                      </span>
                      <span className="truncate text-text-secondary">{r.name}</span>
                    </button>
                  ))}
                  {c.requests.length === 0 && (
                    <div className="py-1 text-[12px] text-text-muted">No requests</div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="space-y-1.5 border-t border-border p-2">
  <button
    type="button"
    onClick={handleNewCollection}
    className="flex w-full items-center border-none gap-2 rounded-md py-2 pl-3 text-accent font-medium text-sm hover:bg-[#3d2413]"
  >
    <Plus size={15} /> New Collection
  </button>

  <button
    type="button"
    className="flex w-full items-center gap-2 rounded-md border border-[#6a3919] bg-[#1d140e] py-2 pl-3 text-accent font-medium text-sm hover:bg-[#28190e]"
  >
    <Globe size={15} /> Import from URL
  </button>


  <button
    type="button"
    className="flex w-full items-center gap-2 py-2 pl-3 text-text-secondary hover:text-text-primary text-xs"
  >
    <Download size={14} /> Import from file
  </button>
</div>
    </div>
  );
}
