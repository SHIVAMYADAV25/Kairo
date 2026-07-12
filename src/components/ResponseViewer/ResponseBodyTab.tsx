import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, MousePointerClick, Braces } from "lucide-react";
import type { ApiResponse } from "@/types";
import { JsonTree } from "./JsonTree";

type ViewMode = "tree" | "raw";
type Lang = "auto" | "json" | "xml" | "html" | "text";

interface Props {
  response: ApiResponse;
}

export function ResponseBodyTab({ response }: Props) {
  const [mode, setMode] = useState<ViewMode>("tree");
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<Lang>("auto");
  const [pretty, setPretty] = useState(true);

  const parsed = useMemo(() => {
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response.body]);

  const rawDisplay = useMemo(() => {
    if (!pretty) return response.body;
    if (parsed !== null) return JSON.stringify(parsed, null, 2);
    return response.body;
  }, [response.body, parsed, pretty]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <button
          onClick={() => setMode("tree")}
          className={clsx(
            "rounded-md px-2.5 py-1 text-[12px]",
            mode === "tree" ? "bg-accent text-black" : "text-text-secondary hover:bg-bg-hover"
          )}
        >
          Tree
        </button>
        <button
          onClick={() => setMode("raw")}
          className={clsx(
            "rounded-md px-2.5 py-1 text-[12px]",
            mode === "raw" ? "bg-accent text-black" : "text-text-secondary hover:bg-bg-hover"
          )}
        >
          View Raw
        </button>
      </div>

      {mode === "tree" && (
        <>
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keys and values..."
                className="w-full rounded-md border border-border bg-bg-elevated py-1.5 pl-7 pr-2 text-[12px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1 border-b border-border px-3 py-1.5 text-[11px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <MousePointerClick size={11} className="shrink-0 text-text-muted" />
              Click any key to copy its JS path
            </div>
            <div className="flex items-center gap-1.5">
              <Braces size={11} className="shrink-0 text-text-muted" />
              <span>
                Use <code className="text-accent">data</code> to reference the response body in
                scripts, e.g. <code className="text-accent">data.users[0].name</code>
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 font-mono text-[12px] leading-[1.5]">
            {parsed !== null ? (
              <JsonTree data={parsed} searchQuery={search} />
            ) : (
              <div className="whitespace-pre-wrap text-text-secondary">{response.body}</div>
            )}
          </div>
        </>
      )}

      {mode === "raw" && (
        <pre
          className="flex-1 overflow-auto p-3 font-mono text-text-secondary"
          style={{ fontSize: "var(--font-response)" }}
        >
          {rawDisplay}
        </pre>
      )}

      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[11px] text-text-muted">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          className="rounded bg-transparent text-text-secondary focus:outline-none"
        >
          <option value="auto">Auto</option>
          <option value="json">JSON</option>
          <option value="xml">XML</option>
          <option value="html">HTML</option>
          <option value="text">Text</option>
        </select>
        <label className="flex items-center gap-1.5">
          Prettify
          <button
            onClick={() => setPretty((p) => !p)}
            className={clsx(
              "relative h-4 w-7 rounded-full transition-colors",
              pretty ? "bg-accent" : "bg-bg-elevated"
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform",
                pretty ? "translate-x-3.5" : "translate-x-0.5"
              )}
            />
          </button>
        </label>
      </div>
    </div>
  );
}