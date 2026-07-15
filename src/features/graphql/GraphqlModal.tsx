import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, Plus, Braces, Trash2, Play, RefreshCw, Wand2, ChevronRight, ChevronDown, Check, Copy } from "lucide-react";
import { useGraphqlStore, type GraphqlOperation } from "@/stores/graphqlStore";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { formatGraphQL, queryFields, mutationFields, type IntroField, type IntroType } from "@/lib/graphql";
import { uid } from "@/lib/factories";

interface Props {
  open: boolean;
  onClose: () => void;
}

type SubTab = "query" | "variables" | "headers" | "schema";

export function GraphqlModal({ open, onClose }: Props) {
  const { operations, activeOperationId, addOperation, removeOperation, setActive, updateOperation, execute, fetchSchema } = useGraphqlStore();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);
  const [sub, setSub] = useState<SubTab>("query");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && operations.length === 0) addOperation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const active = operations.find((o) => o.id === activeOperationId) ?? null;

  const handleCopyResponse = (body: string) => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-sans select-none backdrop-blur-xs" onClick={onClose}>
      <div className="flex h-[760px] w-[1180px] max-w-full overflow-hidden rounded-md border border-[var(--c-222222)] bg-[var(--c-0c0c0c)] shadow-2xl transition-all" onClick={(e) => e.stopPropagation()}>
        
        {/* ================= LEFT SIDEBAR OPERATIONS LIST ================= */}
        <div className="flex w-[240px] shrink-0 flex-col border-r border-[var(--c-1a1a1a)] bg-[var(--c-090909)]">
          <div className="flex h-12 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4">
            <div className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-neutral-200">
              <Braces size={14} className="text-[#ec4899]" /> GraphQL
            </div>
            <button 
              onClick={() => addOperation()} 
              className="flex h-7 w-7 items-center justify-center rounded border border-[var(--c-242424)] bg-[var(--c-121212)] text-neutral-400 transition-all hover:border-[#ec4899]/60 hover:text-white"
              title="New operation"
            >
              <Plus size={14} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
            {operations.map((op) => (
              <button
                key={op.id}
                onClick={() => setActive(op.id)}
                className={clsx(
                  "group flex w-full flex-col items-start gap-1 rounded px-3 py-2.5 text-left border transition-all",
                  op.id === activeOperationId 
                    ? "bg-[var(--c-181115)] border-[#ec4899]/20 shadow-inner" 
                    : "bg-transparent border-transparent hover:bg-[var(--c-121212)]"
                )}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className={clsx("truncate text-[12px] font-medium", op.id === activeOperationId ? "text-[#ec4899]" : "text-neutral-300")}>
                    {op.name || "Untitled Operation"}
                  </span>
                  <Trash2
                    size={13}
                    className="shrink-0 text-neutral-600 opacity-0 hover:text-rose-500 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeOperation(op.id);
                    }}
                  />
                </div>
                <div className="w-full truncate font-mono text-[10px] text-neutral-500 leading-none">
                  {op.endpoint || "https://..."}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ================= MAIN CONFIGURATION / WORKSPACE AREA ================= */}
        <div className="flex min-w-0 flex-1 flex-col bg-[var(--c-0c0c0c)]">
          <div className="flex h-12 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4 shrink-0">
            <input
              value={active?.name ?? ""}
              onChange={(e) => active && updateOperation(active.id, { name: e.target.value })}
              className="bg-transparent text-[14px] font-medium text-neutral-200 outline-none placeholder:text-neutral-600 focus:text-white"
              placeholder="Operation name..."
            />
            <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 transition-colors">
              <X size={16} />
            </button>
          </div>

          {active ? (
            <>
              {/* Endpoint Connect Control Bar */}
              <div className="flex items-center gap-2 border-b border-[var(--c-1a1a1a)] bg-[var(--c-090909)]/40 p-3 shrink-0">
                <input
                  value={active.endpoint}
                  onChange={(e) => updateOperation(active.id, { endpoint: e.target.value })}
                  placeholder="https://api.example.com/graphql"
                  className="flex-1 h-[34px] rounded border border-[var(--c-262626)] bg-[var(--c-121212)] px-3 font-mono text-[12px] text-neutral-200 outline-none transition-colors focus:border-[#ec4899]/70"
                />
                <button
                  onClick={() => execute(active.id, activeEnvironmentId)}
                  disabled={active.isLoading}
                  className="flex h-[34px] items-center gap-1.5 rounded bg-[#ec4899] px-4 text-[12px] font-semibold text-white hover:bg-[#d83f88] shadow-lg shadow-[#ec4899]/10 transition-colors shrink-0 disabled:opacity-60"
                >
                  <Play size={14} className={clsx(active.isLoading && "animate-pulse")} /> 
                  {active.isLoading ? "Running..." : "Run"}
                </button>
              </div>

              {/* Sub-navigation Tabs Controls Bar */}
              <div className="flex h-9 items-center justify-between border-b border-[var(--c-1a1a1a)] bg-[var(--c-090909)] px-2 shrink-0">
                <div className="flex h-full items-center">
                  {(["query", "variables", "headers", "schema"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSub(t)}
                      className={clsx(
                        "relative h-full px-4 text-[11px] font-medium tracking-wide uppercase transition-colors border-r border-[var(--c-1a1a1a)]",
                        sub === t ? "bg-[var(--c-111111)] text-[#ec4899] font-semibold" : "text-neutral-500 hover:text-neutral-300"
                      )}
                    >
                      {t}
                      {sub === t && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ec4899]" />}
                    </button>
                  ))}
                </div>
                {sub === "query" && (
                  <button
                    onClick={() => updateOperation(active.id, { query: formatGraphQL(active.query) })}
                    className="flex h-6 items-center gap-1.5 rounded px-2.5 text-[11px] text-neutral-400 hover:bg-[var(--c-141414)] hover:text-white transition-colors mr-2"
                  >
                    <Wand2 size={12} /> Format Document
                  </button>
                )}
              </div>

              {/* Core Execution Frame Panel */}
              <div className="flex min-h-0 flex-1 bg-[var(--c-070707)]">
                {/* Left Side Editor Frame */}
                <div className="flex min-w-0 flex-[1.4] flex-col overflow-hidden">
                  {sub === "query" && (
                    <textarea
                      value={active.query}
                      onChange={(e) => updateOperation(active.id, { query: e.target.value })}
                      spellCheck={false}
                      className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-neutral-200 outline-none select-text [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)]"
                      placeholder={"query {\n  \n}"}
                    />
                  )}
                  {sub === "variables" && (
                    <textarea
                      value={active.variables}
                      onChange={(e) => updateOperation(active.id, { variables: e.target.value })}
                      spellCheck={false}
                      className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-neutral-200 outline-none select-text [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)]"
                      placeholder="{\n  \n}"
                    />
                  )}
                  {sub === "headers" && (
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)]">
                      <GraphqlHeadersEditor op={active} onChange={(headers) => updateOperation(active.id, { headers })} />
                    </div>
                  )}
                  {sub === "schema" && (
                    <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)]">
                      <SchemaExplorer
                        op={active}
                        onFetch={() => fetchSchema(active.id, activeEnvironmentId)}
                        onInsertField={(field) => updateOperation(active.id, { query: insertFieldSkeleton(active.query, field) })}
                      />
                    </div>
                  )}
                </div>

                {/* Right Side Response Context Panel */}
                <div className="flex w-[440px] shrink-0 flex-col border-l border-[var(--c-1a1a1a)] bg-[var(--c-090909)]/20">
                  <div className="flex h-8 items-center justify-between border-b border-[var(--c-1a1a1a)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-[var(--c-090909)]/40">
                    <span>Response Viewport</span>
                    {active.response && (
                      <button
                        onClick={() => handleCopyResponse(active.response!.body)}
                        className="flex items-center gap-1 text-neutral-400 hover:text-white transition-colors font-medium lowercase normal-case tracking-normal"
                      >
                        {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        <span className={clsx(copied && "text-emerald-400")}>{copied ? "copied" : "copy body"}</span>
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1 overflow-auto p-4 select-text [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--c-222222)] [&::-webkit-scrollbar-thumb]:rounded-sm">
                    {active.error && (
                      <div className="rounded border border-rose-950/40 bg-rose-950/10 px-3 py-2.5 font-mono text-[12px] text-rose-400 leading-normal">
                        {active.error}
                      </div>
                    )}
                    
                    {!active.error && !active.response && (
                      <div className="flex h-full flex-col items-center justify-center text-neutral-600 gap-1.5 font-mono text-[11px] select-none">
                        <span>Execute the payload instance to fetch remote response.</span>
                      </div>
                    )}
                    
                    {!active.error && active.response && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 font-mono text-[11px] text-neutral-500 border-b border-[var(--c-1a1a1a)]/80 pb-2">
                          <span className={clsx("font-semibold px-1.5 py-0.5 rounded", active.response.status < 400 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
                            {active.response.status} {active.response.statusText}
                          </span>
                          <span>{active.response.timing.totalMs}ms</span>
                          <span>{active.response.sizeBytes}B</span>
                        </div>
                        <pre className="whitespace-pre-wrap break-all font-mono text-[12px] text-neutral-300 leading-relaxed selection:bg-[#ec4899]/20">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(active.response!.body), null, 2);
                            } catch {
                              return active.response!.body;
                            }
                          })()}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-neutral-600 font-mono text-[12px]">
              Select or open a operational configuration pipeline from the list panel to begin.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GraphqlHeadersEditor({ op, onChange }: { op: GraphqlOperation; onChange: (headers: GraphqlOperation["headers"]) => void }) {
  const withBlank = op.headers.length === 0 || op.headers[op.headers.length - 1].key !== ""
    ? [...op.headers, { id: uid(), key: "", value: "", enabled: true }]
    : op.headers;

  const update = (id: string, patch: Partial<GraphqlOperation["headers"][number]>) => {
    const next = withBlank.map((h) => (h.id === id ? { ...h, ...patch } : h));
    onChange(next.filter((h, i) => h.key !== "" || i === next.length - 1));
  };
  const remove = (id: string) => onChange(withBlank.filter((h) => h.id !== id));

  return (
    <div className="p-4 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">HTTP Request Handshake Headers</div>
      <div className="space-y-1.5">
        {withBlank.map((h) => (
          <div key={h.id} className="grid grid-cols-[24px_1fr_1fr_28px] items-center gap-2">
            <input 
              type="checkbox" 
              checked={h.enabled} 
              onChange={(e) => update(h.id, { enabled: e.target.checked })} 
              className="h-3.5 w-3.5 accent-[#ec4899] cursor-pointer" 
            />
            <input 
              value={h.key} 
              onChange={(e) => update(h.id, { key: e.target.value })} 
              placeholder="Key" 
              className="rounded border border-[var(--c-222222)] bg-[var(--c-111111)] px-3 py-1.5 font-mono text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-[#ec4899]/40 focus:bg-[var(--c-141414)]" 
            />
            <input 
              value={h.value} 
              onChange={(e) => update(h.id, { value: e.target.value })} 
              placeholder="Value" 
              className="rounded border border-[var(--c-222222)] bg-[var(--c-111111)] px-3 py-1.5 font-mono text-[11px] text-neutral-200 placeholder:text-neutral-600 outline-none focus:border-[#ec4899]/40 focus:bg-[var(--c-141414)]" 
            />
            <button 
              onClick={() => remove(h.id)} 
              className="flex items-center justify-center h-7 w-7 rounded hover:bg-rose-950/20 text-neutral-600 hover:text-rose-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function insertFieldSkeleton(currentQuery: string, field: IntroField): string {
  const argsPart = field.args.length ? `(${field.args.map((a) => `${a.name}: `).join(", ")})` : "";
  const skeleton = `${field.name}${argsPart}`;
  if (!currentQuery.includes("{")) {
    return `query {\n  ${skeleton}\n}`;
  }
  const lastBrace = currentQuery.lastIndexOf("}");
  if (lastBrace === -1) return `${currentQuery}\n${skeleton}`;
  return `${currentQuery.slice(0, lastBrace)}  ${skeleton}\n${currentQuery.slice(lastBrace)}`;
}

// ================= SCHEMA EXPLORER SUBSYSTEMS =================
function SchemaExplorer({ op, onFetch, onInsertField }: { op: GraphqlOperation; onFetch: () => void; onInsertField: (field: IntroField) => void }) {
  const [openSection, setOpenSection] = useState<"queries" | "mutations" | "types" | null>("queries");
  const [openType, setOpenType] = useState<string | null>(null);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--c-1a1a1a)] pb-3">
        <span className="text-[12px] font-medium text-neutral-400">{op.schema ? "Introspection schema active" : "No active Introspection schema structure"}</span>
        <button 
          onClick={onFetch} 
          disabled={op.schemaLoading} 
          className="flex h-[28px] items-center gap-1.5 rounded border border-[var(--c-262626)] bg-[var(--c-121212)] px-3 text-[11px] text-neutral-300 hover:border-neutral-500 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={clsx(op.schemaLoading && "animate-spin")} /> 
          {op.schemaLoading ? "Fetching..." : "Fetch Schema"}
        </button>
      </div>
      
      {op.schemaError && (
        <div className="rounded border border-rose-950/40 bg-rose-950/10 px-3 py-2 font-mono text-[11px] text-rose-400">
          {op.schemaError}
        </div>
      )}

      {op.schema && (
        <div className="space-y-1 bg-[var(--c-090909)]/30 rounded border border-[var(--c-161616)] p-2">
          <SchemaSection title="Queries" fields={queryFields(op.schema)} open={openSection === "queries"} onToggle={() => setOpenSection(openSection === "queries" ? null : "queries")} onInsertField={onInsertField} />
          <SchemaSection title="Mutations" fields={mutationFields(op.schema)} open={openSection === "mutations"} onToggle={() => setOpenSection(openSection === "mutations" ? null : "mutations")} onInsertField={onInsertField} />
          
          <div className="border-t border-[var(--c-161616)] mt-1 pt-1">
            <button onClick={() => setOpenSection(openSection === "types" ? null : "types")} className="flex w-full items-center gap-1.5 py-1.5 px-2 text-[12px] font-medium text-neutral-300 hover:bg-[var(--c-121212)] rounded transition-colors">
              {openSection === "types" ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />} 
              <span>Types</span>
              <span className="ml-auto font-mono text-[10px] text-neutral-600 bg-neutral-900 border border-[var(--c-1a1a1a)] px-1 rounded">{op.schema.types.length}</span>
            </button>
            
            {openSection === "types" && (
              <div className="mt-1 ml-4 pl-1 space-y-0.5 border-l border-[var(--c-1a1a1a)]">
                {op.schema.types.map((t: IntroType) => (
                  <div key={t.name} className="space-y-0.5">
                    <button 
                      onClick={() => setOpenType(openType === t.name ? null : t.name)} 
                      className="flex w-full items-center gap-1.5 py-1 px-2 rounded text-left text-[12px] text-neutral-400 hover:bg-[var(--c-121212)] hover:text-neutral-200 transition-colors"
                    >
                      {t.fields.length > 0 ? (openType === t.name ? <ChevronDown size={12} className="text-neutral-600" /> : <ChevronRight size={12} className="text-neutral-600" />) : <span className="w-3" />}
                      <span className="text-[10px] uppercase font-bold text-[#ec4899]/70 tracking-wider text-[9px]">{t.kind}</span> 
                      <span className="font-mono text-neutral-300">{t.name}</span>
                    </button>
                    
                    {openType === t.name && t.fields.length > 0 && (
                      <div className="ml-6 border-l border-[var(--c-222222)] pl-3 py-1 space-y-1 bg-[var(--c-060606)]/60 rounded-r p-2">
                        {t.fields.map((f) => (
                          <div key={f.name} className="text-[11px] font-mono text-neutral-500">
                            <span className="text-neutral-300">{f.name}</span>: <span className="text-[#ec4899]/80">{f.type}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SchemaSection({ title, fields, open, onToggle, onInsertField }: { title: string; fields: IntroField[]; open: boolean; onToggle: () => void; onInsertField: (f: IntroField) => void }) {
  if (fields.length === 0) return null;
  return (
    <div className="border-b border-[var(--c-161616)]/40 last:border-none pb-0.5">
      <button onClick={onToggle} className="flex w-full items-center gap-1.5 py-1.5 px-2 text-[12px] font-medium text-neutral-300 hover:bg-[var(--c-121212)] rounded transition-colors">
        {open ? <ChevronDown size={14} className="text-neutral-500" /> : <ChevronRight size={14} className="text-neutral-500" />} 
        <span>{title}</span>
        <span className="ml-auto font-mono text-[10px] text-neutral-600 bg-neutral-900 border border-[var(--c-1a1a1a)] px-1 rounded">{fields.length}</span>
      </button>
      {open && (
        <div className="mt-1 ml-4 pl-1 space-y-0.5 border-l border-[var(--c-1a1a1a)]">
          {fields.map((f) => (
            <button 
              key={f.name} 
              onClick={() => onInsertField(f)} 
              className="flex w-full items-center justify-between rounded px-2.5 py-1 text-left font-mono text-[11.5px] hover:bg-[var(--c-121212)] group transition-all"
            >
              <span className="text-neutral-400 group-hover:text-[#ec4899] transition-colors">{f.name}</span>
              <span className="text-neutral-600 text-[10px] font-sans">{f.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}