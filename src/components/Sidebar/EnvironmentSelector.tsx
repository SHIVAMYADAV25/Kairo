import { useState } from "react";
import { ChevronDown, Settings as SettingsIcon, Sliders } from "lucide-react";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { EnvironmentsModal } from "@/features/environments/EnvironmentsModal";

interface Props {
  onOpenSettings: () => void;
}

export function EnvironmentSelector({ onOpenSettings }: Props) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const { environments, activeEnvironmentId, setActive } = useEnvironmentStore();
  const active = environments.find((e) => e.id === activeEnvironmentId);

  return (
    <div className="flex items-center gap-2 px-1">
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
      
          className="flex items-center gap-2 rounded-lg border border-border bg-bg-panel px-4 py-1 text-[12.5px] font-semibold text-text-primary transition-colors hover:bg-bg-hover"
        >
          {active ? active.name : "No Environment"}
          <ChevronDown size={13} className="text-text-muted opacity-80" />
        </button>
        
        {open && (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-lg border border-border bg-bg-elevated shadow-xl">
            <button
              onClick={() => {
                setActive(null);
                setOpen(false);
              }}
              className="block w-full px-3 py-2 text-left text-[6px] text-text-secondary hover:bg-bg-hover"
            >
              No Environment
            </button>
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => {
                  setActive(env.id);
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-[13px] text-text-secondary hover:bg-bg-hover"
              >
                {env.name}
              </button>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                setModalOpen(true);
              }}
              className="flex w-full items-center gap-2 border-t border-border px-3 py-2 text-left text-[13px] text-accent hover:bg-bg-hover"
            >
              <Sliders size={13} /> Manage Environments
            </button>
          </div>
        )}
      </div>
      
      {/* Settings Gear Button rounded matching the interface vibe */}
      <button
        onClick={onOpenSettings}
        className="rounded-full p-2 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
        title="Settings"
      >
        <SettingsIcon size={16} />
      </button>

      <EnvironmentsModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}