import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Check, Layers } from "lucide-react";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { KeyValueTable } from "@/components/RequestBuilder/KeyValueTable";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import type { Environment } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  initialSelectedId?: string | null;
  /** When true (e.g. opened from the sidebar's "+ New environment" button),
   * the inline "new environment" form is shown immediately instead of
   * requiring an extra click once the modal is open. */
  initialCreating?: boolean;
}

export function EnvironmentsModal({
  open,
  onClose,
  initialSelectedId = null,
  initialCreating = false,
}: Props) {
  const { environments, activeEnvironmentId, load, create, update, remove, setActive } =
    useEnvironmentStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Environment | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newEnvName, setNewEnvName] = useState("");
  const newEnvInputRef = useRef<HTMLInputElement>(null);
  
  // Track client-side form validation error messages
  const [validationError, setValidationError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      load().catch(() => {});
      setSelectedId(initialSelectedId);
      setCreatingNew(initialCreating);
      setNewEnvName("");
      setValidationError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialSelectedId, initialCreating]);

  useEffect(() => {
    if (creatingNew) newEnvInputRef.current?.focus();
  }, [creatingNew]);

  useEffect(() => {
    const found = environments.find((e) => e.id === selectedId);
    setDraft(found ? { ...found } : null);
    setValidationError(null); // Clear errors when switching active environments
  }, [selectedId, environments]);

  if (!open) return null;

  const cancelCreate = () => {
    setCreatingNew(false);
    setNewEnvName("");
  };

  const handleConfirmCreate = async () => {
    const name = newEnvName.trim();
    if (!name) {
      cancelCreate();
      return;
    }
    await create(name).catch(() => {});
    const latest = useEnvironmentStore.getState().environments.slice(-1)[0];
    if (latest) setSelectedId(latest.id);
    cancelCreate();
  };

  const handleSave = async () => {
    if (!draft) return;

    // Filter out completely untouched empty placeholder rows first
    const activeRows = draft.variables.filter(
      (v: any) => (v.key && v.key.trim() !== "") || (v.value && v.value.trim() !== "")
    );

    // Track seen keys to catch duplicate name repetitions
    const seenKeys = new Set<string>();

    // Validate that every active item has both properties configured & no duplicates exist
    for (const variable of activeRows) {
      const normalizedKey = variable.key?.trim().toLowerCase() || "";
      const hasKey = normalizedKey !== "";
      const hasValue = variable.value && variable.value.trim() !== "";

      // 1. Check for Missing Configuration Pairs
      if (hasKey && !hasValue) {
        setValidationError(`Validation Error: Please provide a value for key "${variable.key}"`);
        return;
      }
      if (!hasKey && hasValue) {
        setValidationError(`Validation Error: Please provide a key for value "${variable.value}"`);
        return;
      }

      // 2. Check for Duplicate Keys
      if (hasKey) {
        if (seenKeys.has(normalizedKey)) {
          setValidationError(`Duplicate Error: The variable name "${variable.key}" is used more than once in this environment.`);
          return;
        }
        seenKeys.add(normalizedKey);
      }
    }

    // Clear previous dynamic errors and write complete payload back to the underlying store
    setValidationError(null);
    await update({
      ...draft,
      variables: activeRows,
    }).catch(() => {});
  };

  const handleDelete = (id: string) => setDeleteTargetId(id);

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    await remove(id).catch(() => {});
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="flex h-[560px] w-[820px] overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side: Environment Navigation Panel */}
        <div className="flex w-[260px] shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h2 className="text-[18px] font-semibold text-text-primary">Environments</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pt-2">
            {environments.length === 0 && !creatingNew && (
              <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                <div className="rounded-full bg-bg-elevated p-2.5 text-text-muted">
                  <Layers size={18} />
                </div>
                <p className="text-[12px] text-text-muted">No environments yet.</p>
              </div>
            )}

            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setSelectedId(env.id)}
                className={`group flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-[13px] transition-colors ${
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
                {activeEnvironmentId === env.id && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                    Active
                  </span>
                )}
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

          {/* New Environment Control Drawer */}
          <div className="border-t border-border p-3">
            {creatingNew ? (
              <div className="flex items-center gap-1.5">
                <input
                  ref={newEnvInputRef}
                  value={newEnvName}
                  onChange={(e) => setNewEnvName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirmCreate();
                    if (e.key === "Escape") cancelCreate();
                  }}
                  onBlur={() => {
                    if (!newEnvName.trim()) cancelCreate();
                  }}
                  placeholder="Environment name"
                  className="flex-1 rounded-md border border-border bg-bg-elevated px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
                />
                <button
                  onClick={handleConfirmCreate}
                  className="shrink-0 rounded-md bg-accent p-1.5 text-black hover:bg-accent-hover"
                  title="Create environment"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreatingNew(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-2 text-[13px] text-text-secondary hover:border-accent hover:text-accent"
              >
                <Plus size={15} /> New Environment
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Variable Key Value Editor Area */}
        <div className="flex flex-1 flex-col">
          <div className="flex justify-end border-b border-border p-3">
            <button onClick={onClose} className="text-text-muted hover:text-text-primary">
              <X size={20} />
            </button>
          </div>

          {!draft ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="rounded-full bg-bg-elevated p-3 text-text-muted">
                <Layers size={22} />
              </div>
              <div className="text-[14px] font-medium text-text-primary">
                {environments.length === 0 ? "Create your first environment" : "Select an environment"}
              </div>
              <p className="max-w-[320px] text-[12.5px] text-text-muted">
                Environments store variables like base URLs, tokens, and keys
                so you can switch between dev, staging, and prod without
                editing every request.
              </p>
              {environments.length === 0 && (
                <button
                  onClick={() => setCreatingNew(true)}
                  className="mt-1 flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover"
                >
                  <Plus size={14} /> New Environment
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Dynamic Warning Alert Bar Banner */}
              {validationError && (
                <div className="bg-status-error/15 text-status-error border-b border-status-error/20 px-4 py-2 text-[12.5px] font-medium flex justify-between items-center animate-fadeIn">
                  <span>{validationError}</span>
                  <button 
                    onClick={() => setValidationError(null)}
                    className="hover:opacity-80 font-bold ml-2 text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}

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
                  className="rounded-md bg-accent px-4 py-1.5 text-[13px] font-medium text-black hover:bg-accent-hover transition-all"
                >
                  Save
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <KeyValueTable
                  rows={draft.variables}
                  onChange={(rows) => {
                    setDraft({ ...draft, variables: rows });
                    if (validationError) setValidationError(null); // Reset layout when key corrections begin
                  }}
                  keyPlaceholder="Variable name"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteTargetId !== null}
        title="Delete environment"
        message="This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}