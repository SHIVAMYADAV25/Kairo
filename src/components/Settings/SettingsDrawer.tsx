import clsx from "clsx";
import { X, Minus, Plus } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

function FontStepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(10, value - 1))}
          className="rounded p-1 text-text-secondary hover:bg-bg-hover"
        >
          <Minus size={14} />
        </button>
        <span className="w-10 text-center text-text-primary">{value}px</span>
        <button
          onClick={() => onChange(Math.min(24, value + 1))}
          className="rounded p-1 text-text-secondary hover:bg-bg-hover"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

export function SettingsDrawer({ open, onClose }: Props) {
  const { settings, update } = useSettingsStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-[380px] overflow-y-auto border-l border-border bg-bg-panel p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-[20px] font-semibold text-text-primary">Settings</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <section className="mb-6">
          <h3 className="mb-3 text-[15px] font-medium text-text-primary">Appearance</h3>
          <div className="flex gap-2">
            {(["dark", "light"] as const).map((th) => (
              <button
                key={th}
                onClick={() => update({ theme: th })}
                className={clsx(
                  "flex-1 rounded-md border py-2 capitalize",
                  settings.theme === th
                    ? "border-accent bg-bg-elevated text-text-primary"
                    : "border-border text-text-secondary hover:bg-bg-hover"
                )}
              >
                {th}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-6 flex items-center justify-between">
          <div>
            <div className="text-text-primary">Opaque Mode</div>
            <div className="text-[12px] text-text-muted">Solid background instead of transparency</div>
          </div>
          <button
            onClick={() => update({ opaqueMode: !settings.opaqueMode })}
            className={clsx(
              "relative h-6 w-11 shrink-0 rounded-full transition-colors",
              settings.opaqueMode ? "bg-accent" : "bg-bg-elevated"
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                settings.opaqueMode ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
        </section>

        <section>
          <h3 className="mb-1 text-[15px] font-medium text-text-primary">Font Size</h3>
          <div className="divide-y divide-border">
            <FontStepper
              label="Sidebar"
              value={settings.fontSizes.sidebar}
              onChange={(v) => update({ fontSizes: { ...settings.fontSizes, sidebar: v } })}
            />
            <FontStepper
              label="Request Panel"
              value={settings.fontSizes.request}
              onChange={(v) => update({ fontSizes: { ...settings.fontSizes, request: v } })}
            />
            <FontStepper
              label="Response Panel"
              value={settings.fontSizes.response}
              onChange={(v) => update({ fontSizes: { ...settings.fontSizes, response: v } })}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
