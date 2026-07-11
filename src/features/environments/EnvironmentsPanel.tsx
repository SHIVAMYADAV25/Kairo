import { useEffect, useState } from "react";
import { Plus, Sliders, ChevronRight, ChevronDown, Pencil, CheckCircle2, Circle } from "lucide-react";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { EnvironmentsModal } from "./EnvironmentsModal";
import { uid } from "@/lib/factories";

/**
 * Fix #7: previously clicking an environment row only ever set it active —
 * there was no visible path from "I see a list of environments" to "I can
 * add a variable to this one" short of already knowing to open the small
 * sliders icon in the header. Each row now expands in place to show its
 * variables with an always-visible "+ Add variable" quick-add form, plus an
 * explicit pencil button that jumps straight into the full editor (for
 * renaming, bulk edits, enabling/disabling, etc.) pre-focused on that
 * environment.
 */
export function EnvironmentsPanel() {
  const { environments, activeEnvironmentId, load, setActive, create, update } = useEnvironmentStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quickKey, setQuickKey] = useState("");
  const [quickValue, setQuickValue] = useState("");

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleCreateRoot = async () => {
    const name = window.prompt("Environment name");
    if (!name) return;
    await create(name).catch(() => {});
    const latest = useEnvironmentStore.getState().environments.slice(-1)[0];
    if (latest) setExpandedId(latest.id);
  };

  const openEditor = (envId: string) => {
    setModalTargetId(envId);
    setModalOpen(true);
  };

  const toggleExpand = (envId: string) => {
    setExpandedId((cur) => (cur === envId ? null : envId));
    setQuickKey("");
    setQuickValue("");
  };

  const handleQuickAdd = async (envId: string) => {
    const key = quickKey.trim();
    if (!key) return;
    const env = environments.find((e) => e.id === envId);
    if (!env) return;
    await update({
      ...env,
      variables: [...env.variables, { id: uid(), key, value: quickValue, enabled: true }],
    }).catch(() => {});
    setQuickKey("");
    setQuickValue("");
  };

  return (
    <div className="flex h-full flex-col" style={{ fontSize: "var(--font-sidebar)" }}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-medium text-text-primary">Environments</span>
        <div className="flex gap-1">
          <button
            onClick={() => openEditor(environments[0]?.id ?? "")}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
            title="Manage all environments"
          >
            <Sliders size={15} />
          </button>
          <button
            onClick={handleCreateRoot}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
            title="New environment"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {environments.length === 0 && (
          <div className="mt-6 text-center text-text-muted">
            No environments yet
            <div className="mt-2">
              <button onClick={handleCreateRoot} className="text-[12px] font-medium text-accent hover:text-accent-hover">
                + Create your first environment
              </button>
            </div>
          </div>
        )}

        {environments.map((env) => {
          const isActive = activeEnvironmentId === env.id;
          const isExpanded = expandedId === env.id;
          return (
            <div key={env.id} className="mb-1 rounded-md">
              <div className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-bg-hover">
                <button onClick={() => toggleExpand(env.id)} className="p-0.5 text-text-muted">
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>

                {/* Explicit "set active" control, separate from expand/click-to-edit */}
                <button
                  onClick={() => setActive(env.id)}
                  title={isActive ? "Active environment" : "Set as active environment"}
                  className={isActive ? "text-accent" : "text-text-muted hover:text-text-secondary"}
                >
                  {isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                </button>

                <button
                  onClick={() => toggleExpand(env.id)}
                  className={`flex-1 truncate px-1 py-0.5 text-left ${isActive ? "text-accent" : "text-text-secondary"}`}
                >
                  {env.name}
                </button>

                <span className="text-[11px] text-text-muted">{env.variables.length}</span>
                <button
                  onClick={() => openEditor(env.id)}
                  className="rounded p-1 text-text-muted opacity-0 hover:bg-bg-elevated group-hover:opacity-100"
                  title="Edit all variables"
                >
                  <Pencil size={12} />
                </button>
              </div>

              {isExpanded && (
                <div className="ml-6 border-l border-border pl-2 pb-2 pt-1">
                  {env.variables.length === 0 ? (
                    <div className="py-1 text-[12px] text-text-muted">No variables yet</div>
                  ) : (
                    <div className="space-y-1">
                      {env.variables.map((v) => (
                        <div key={v.id} className="flex items-center justify-between text-[12px]">
                          <span className="truncate font-mono text-text-secondary">{v.key}</span>
                          <span className="truncate text-text-muted">{v.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Always-visible quick-add row — this is the "how do I add a
                      variable to this specific environment" affordance that
                      was missing before. */}
                  <div className="mt-2 flex items-center gap-1">
                    <input
                      value={quickKey}
                      onChange={(e) => setQuickKey(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuickAdd(env.id)}
                      placeholder="Variable name"
                      className="w-[45%] rounded border border-border bg-bg-elevated px-1.5 py-1 text-[12px] text-text-primary outline-none focus:border-accent"
                    />
                    <input
                      value={quickValue}
                      onChange={(e) => setQuickValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleQuickAdd(env.id)}
                      placeholder="Value"
                      className="flex-1 rounded border border-border bg-bg-elevated px-1.5 py-1 text-[12px] text-text-primary outline-none focus:border-accent"
                    />
                    <button
                      onClick={() => handleQuickAdd(env.id)}
                      disabled={!quickKey.trim()}
                      className="rounded bg-accent p-1 text-black disabled:opacity-40"
                      title="Add variable"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <EnvironmentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSelectedId={modalTargetId}
      />
    </div>
  );
}
