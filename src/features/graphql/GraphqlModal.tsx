import { useEffect, useState } from "react";
import clsx from "clsx";
import { X, Plus, Braces, Trash2, Play, RefreshCw, Wand2, ChevronRight, ChevronDown } from "lucide-react";
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

  useEffect(() => {
    if (open && operations.length === 0) addOperation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const active = operations.find((o) => o.id === activeOperationId) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <div className="flex h-[85vh] w-[1200px] max-w-full overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex w-[230px] shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-3 py-3">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-text-primary">
              <Braces size={15} className="text-[#ec4899]" /> GraphQL
            </div>
            <button onClick={() => addOperation()} className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-accent" title="New operation">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {operations.map((op) => (
              <button
                key={op.id}
                onClick={() => setActive(op.id)}
                className={clsx("group flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left", op.id === activeOperationId ? "bg-[#ec4899]/15" : "hover:bg-bg-hover")}
              >
                <div className="min-w-0 flex-1">
                  <div className={clsx("truncate text-[13px]", op.id === activeOperationId ? "font-medium text-text-primary" : "text-text-secondary")}>{op.name}</div>
                  <div className="truncate font-mono text-[11px] text-text-muted">{op.endpoint}</div>
                </div>
                <Trash2
                  size={12}
                  className="shrink-0 text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeOperation(op.id);
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <input
              value={active?.name ?? ""}
              onChange={(e) => active && updateOperation(active.id, { name: e.target.value })}
              className="bg-transparent text-[15px] font-semibold text-text-primary outline-none"
              placeholder="Operation name"
            />
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X size={18} />
            </button>
          </div>

          {active && (
            <>
              <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
                <input
                  value={active.endpoint}
                  onChange={(e) => updateOperation(active.id, { endpoint: e.target.value })}
                  placeholder="https://api.example.com/graphql"
                  className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted focus:border-[#ec4899] focus:outline-none"
                />
                <button
                  onClick={() => execute(active.id, activeEnvironmentId)}
                  disabled={active.isLoading}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-black hover:bg-accent-hover disabled:opacity-60"
                >
                  <Play size={14} /> {active.isLoading ? "Running..." : "Run"}
                </button>
              </div>

              <div className="flex border-b border-border px-2">
                {(["query", "variables", "headers", "schema"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSub(t)}
                    className={clsx(
                      "relative px-3 py-2.5 text-[13px] font-medium capitalize transition-colors",
                      sub === t ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
                    )}
                  >
                    {t}
                    {sub === t && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ec4899]" />}
                  </button>
                ))}
                {sub === "query" && (
                  <button
                    onClick={() => updateOperation(active.id, { query: formatGraphQL(active.query) })}
                    className="ml-auto flex items-center gap-1.5 self-center rounded-md px-2.5 py-1 text-[12px] text-text-muted hover:bg-bg-hover hover:text-text-primary"
                  >
                    <Wand2 size={12} /> Format
                  </button>
                )}
              </div>

              <div className="flex min-h-0 flex-1">
                <div className="flex min-w-0 flex-[1.4] flex-col overflow-hidden">
                  {sub === "query" && (
                    <textarea
                      value={active.query}
                      onChange={(e) => updateOperation(active.id, { query: e.target.value })}
                      spellCheck={false}
                      className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-text-primary outline-none"
                      placeholder={"query {\n  \n}"}
                    />
                  )}
                  {sub === "variables" && (
                    <textarea
                      value={active.variables}
                      onChange={(e) => updateOperation(active.id, { variables: e.target.value })}
                      spellCheck={false}
                      className="h-full w-full resize-none border-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-text-primary outline-none"
                      placeholder="{}"
                    />
                  )}
                  {sub === "headers" && <GraphqlHeadersEditor op={active} onChange={(headers) => updateOperation(active.id, { headers })} />}
                  {sub === "schema" && (
                    <SchemaExplorer
                      op={active}
                      onFetch={() => fetchSchema(active.id, activeEnvironmentId)}
                      onInsertField={(field) => updateOperation(active.id, { query: insertFieldSkeleton(active.query, field) })}
                    />
                  )}
                </div>

                <div className="flex w-[420px] shrink-0 flex-col border-l border-border">
                  <div className="border-b border-border px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">Response</div>
                  <div className="flex-1 overflow-auto p-3">
                    {active.error && <div className="text-[13px] text-status-error">{active.error}</div>}
                    {!active.error && !active.response && <div className="flex h-full items-center justify-center text-text-muted">Run the operation to see a response</div>}
                    {active.response && (
                      <>
                        <div className="mb-2 flex items-center gap-3 text-[12px] text-text-muted">
                          <span className={clsx("font-semibold", active.response.status < 400 ? "text-status-success" : "text-status-error")}>
                            {active.response.status} {active.response.statusText}
                          </span>
                          <span>{active.response.timing.totalMs}ms</span>
                          <span>{active.response.sizeBytes}B</span>
                        </div>
                        <pre className="whitespace-pre-wrap break-all font-mono text-[12.5px] text-text-secondary">
                          {(() => {
                            try {
                              return JSON.stringify(JSON.parse(active.response!.body), null, 2);
                            } catch {
                              return active.response!.body;
                            }
                          })()}
                        </pre>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
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
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Request headers (e.g. Authorization)</div>
      <div className="space-y-1.5">
        {withBlank.map((h) => (
          <div key={h.id} className="grid grid-cols-[24px_1fr_1fr_28px] items-center gap-2">
            <input type="checkbox" checked={h.enabled} onChange={(e) => update(h.id, { enabled: e.target.checked })} className="h-4 w-4 accent-[#ec4899]" />
            <input value={h.key} onChange={(e) => update(h.id, { key: e.target.value })} placeholder="Key" className="rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none focus:bg-[#161616]" />
            <input value={h.value} onChange={(e) => update(h.id, { value: e.target.value })} placeholder="Value" className="rounded-md border-none bg-[#111111] px-3 py-2 text-text-primary placeholder:text-[#737373] outline-none focus:bg-[#161616]" />
            <button onClick={() => remove(h.id)} className="flex items-center justify-center text-text-muted/40 hover:text-status-error">
              <Trash2 size={14} />
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

function SchemaExplorer({ op, onFetch, onInsertField }: { op: GraphqlOperation; onFetch: () => void; onInsertField: (field: IntroField) => void }) {
  const [openSection, setOpenSection] = useState<"queries" | "mutations" | "types" | null>("queries");
  const [openType, setOpenType] = useState<string | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[13px] text-text-secondary">{op.schema ? "Schema loaded" : "No schema loaded yet"}</span>
        <button onClick={onFetch} disabled={op.schemaLoading} className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-hover disabled:opacity-50">
          <RefreshCw size={12} className={op.schemaLoading ? "animate-spin" : ""} /> {op.schemaLoading ? "Fetching..." : "Fetch Schema"}
        </button>
      </div>
      {op.schemaError && <div className="mb-3 text-[12px] text-status-error">{op.schemaError}</div>}

      {op.schema && (
        <div className="space-y-3">
          <SchemaSection title="Queries" fields={queryFields(op.schema)} open={openSection === "queries"} onToggle={() => setOpenSection(openSection === "queries" ? null : "queries")} onInsertField={onInsertField} />
          <SchemaSection title="Mutations" fields={mutationFields(op.schema)} open={openSection === "mutations"} onToggle={() => setOpenSection(openSection === "mutations" ? null : "mutations")} onInsertField={onInsertField} />
          <div>
            <button onClick={() => setOpenSection(openSection === "types" ? null : "types")} className="flex w-full items-center gap-1.5 py-1.5 text-[13px] font-semibold text-text-primary">
              {openSection === "types" ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Types ({op.schema.types.length})
            </button>
            {openSection === "types" && (
              <div className="ml-4 space-y-1">
                {op.schema.types.map((t: IntroType) => (
                  <div key={t.name}>
                    <button onClick={() => setOpenType(openType === t.name ? null : t.name)} className="flex w-full items-center gap-1.5 py-1 text-left text-[12.5px] text-text-secondary hover:text-text-primary">
                      {t.fields.length > 0 ? (openType === t.name ? <ChevronDown size={12} /> : <ChevronRight size={12} />) : <span className="w-3" />}
                      <span className="text-[#ec4899]">{t.kind}</span> {t.name}
                    </button>
                    {openType === t.name && t.fields.length > 0 && (
                      <div className="ml-5 border-l border-border pl-3">
                        {t.fields.map((f) => (
                          <div key={f.name} className="py-0.5 text-[12px] text-text-muted">
                            {f.name}: <span className="text-text-secondary">{f.type}</span>
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
    <div>
      <button onClick={onToggle} className="flex w-full items-center gap-1.5 py-1.5 text-[13px] font-semibold text-text-primary">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {title} ({fields.length})
      </button>
      {open && (
        <div className="ml-4 space-y-1">
          {fields.map((f) => (
            <button key={f.name} onClick={() => onInsertField(f)} className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-[12.5px] hover:bg-bg-hover">
              <span className="text-text-secondary">{f.name}</span>
              <span className="text-text-muted">{f.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}