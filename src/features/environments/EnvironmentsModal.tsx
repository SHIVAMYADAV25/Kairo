import { useEffect, useState } from "react";
import { X, Plus, Trash2, Check } from "lucide-react";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { KeyValueTable } from "@/components/RequestBuilder/KeyValueTable";
import type { Environment } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EnvironmentsModal({ open, onClose }: Props) {
  const { environments, activeEnvironmentId, load, create, update, remove, setActive } =
    useEnvironmentStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Environment | null>(null);

  useEffect(() => {
    if (open) load().catch(() => {});
  }, [open, load]);

  useEffect(() => {
    const found = environments.find((e) => e.id === selectedId);
    setDraft(found ? { ...found } : null);
  }, [selectedId, environments]);

  if (!open) return null;

  const handleNewEnvironment = async () => {
    const name = window.prompt("Environment name", "New Environment");
    if (!name) return;
    await create(name).catch(() => {});
    // The store appends the new env; select the most recently created one.
    const latest = useEnvironmentStore.getState().environments.slice(-1)[0];
    if (latest) setSelectedId(latest.id);
  };

  const handleSave = async () => {
    if (!draft) return;
    await update(draft).catch(() => {});
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this environment?")) return;
    await remove(id).catch(() => {});
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex h-[560px] w-[820px] overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: environment list */}
        <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-[18px] font-semibold text-text-primary">Environments</h2>
          </div>
          <div className="p-3">
            <button
              onClick={handleNewEnvironment}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-[13px] text-text-secondary hover:border-accent hover:text-accent"
            >
              <Plus size={15} /> New Environment
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setSelectedId(env.id)}
                className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] ${
                  selectedId === env.id
                    ? "bg-bg-hover text-text-primary"
                    : "text-text-secondary hover:bg-bg-hover"
                }`}
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    activeEnvironmentId === env.id ? "bg-accent" : "bg-border"
                  }`}
                />
                <span className="flex-1 truncate">{env.name}</span>
                <Trash2
                  size={13}
                  className="shrink-0 text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(env.id);
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right: editor / placeholder */}
        <div className="flex flex-1 flex-col">
          <div className="flex justify-end border-b border-border p-3">
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X size={20} />
            </button>
          </div>

          {!draft ? (
            <div className="flex flex-1 items-center justify-center text-text-muted">
              Select an environment
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-3 border-b border-border p-4">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-[15px] font-medium text-text-primary focus:border-accent focus:outline-none"
                />
                {activeEnvironmentId !== draft.id && (
                  <button
                    onClick={() => setActive(draft.id)}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[13px] text-text-secondary hover:bg-bg-hover"
                  >
                    <Check size={14} /> Set Active
                  </button>
                )}
                <button
                  onClick={handleSave}
                  className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover"
                >
                  Save
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <KeyValueTable
                  rows={draft.variables}
                  onChange={(rows) => setDraft({ ...draft, variables: rows })}
                  keyPlaceholder="Variable name"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
