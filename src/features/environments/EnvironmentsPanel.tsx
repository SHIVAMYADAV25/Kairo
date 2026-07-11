import { useEffect, useState } from "react";
import { Plus, Sliders } from "lucide-react";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { EnvironmentsModal } from "./EnvironmentsModal";

export function EnvironmentsPanel() {
  const { environments, activeEnvironmentId, load, setActive, create } = useEnvironmentStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const handleCreate = async () => {
    const name = window.prompt("Environment name");
    if (name) await create(name).catch(() => {});
  };

  return (
    <div className="flex h-full flex-col" style={{ fontSize: "var(--font-sidebar)" }}>
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-medium text-text-primary">Environments</span>
        <div className="flex gap-1">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
            title="Manage environments"
          >
            <Sliders size={15} />
          </button>
          <button onClick={handleCreate} className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover">
            <Plus size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {environments.length === 0 && (
          <div className="mt-6 text-center text-text-muted">No environments yet</div>
        )}
        {environments.map((env) => (
          <button
            key={env.id}
            onClick={() => setActive(env.id)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-bg-hover ${
              activeEnvironmentId === env.id ? "text-accent" : "text-text-secondary"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                activeEnvironmentId === env.id ? "bg-accent" : "bg-text-muted"
              }`}
            />
            {env.name}
            <span className="ml-auto text-[11px] text-text-muted">{env.variables.length} vars</span>
          </button>
        ))}
      </div>

      <EnvironmentsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
