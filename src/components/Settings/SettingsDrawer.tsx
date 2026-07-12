// import clsx from "clsx";
// import { X, Minus, Plus } from "lucide-react";
// import { useSettingsStore } from "@/stores/settingsStore";

// interface Props {
//   open: boolean;
//   onClose: () => void;
// }

// function FontStepper({
//   label,
//   value,
//   onChange,
// }: {
//   label: string;
//   value: number;
//   onChange: (v: number) => void;
// }) {
//   return (
//     <div className="flex items-center justify-between py-2">
//       <span className="text-text-secondary">{label}</span>
//       <div className="flex items-center gap-3">
//         <button
//           onClick={() => onChange(Math.max(10, value - 1))}
//           className="rounded p-1 text-text-secondary hover:bg-bg-hover"
//         >
//           <Minus size={14} />
//         </button>
//         <span className="w-10 text-center text-text-primary">{value}px</span>
//         <button
//           onClick={() => onChange(Math.min(24, value + 1))}
//           className="rounded p-1 text-text-secondary hover:bg-bg-hover"
//         >
//           <Plus size={14} />
//         </button>
//       </div>
//     </div>
//   );
// }

// export function SettingsDrawer({ open, onClose }: Props) {
//   const { settings, update } = useSettingsStore();

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
//       <div
//         className="h-full w-[380px] overflow-y-auto border-l border-border bg-bg-panel p-5"
//         onClick={(e) => e.stopPropagation()}
//       >
//         <div className="mb-6 flex items-center justify-between">
//           <h2 className="text-[20px] font-semibold text-text-primary">Settings</h2>
//           <button onClick={onClose} className="text-text-muted hover:text-text-primary">
//             <X size={20} />
//           </button>
//         </div>

//         <section className="mb-6">
//           <h3 className="mb-3 text-[15px] font-medium text-text-primary">Appearance</h3>
//           <div className="flex gap-2">
//             {(["dark", "light"] as const).map((th) => (
//               <button
//                 key={th}
//                 onClick={() => update({ theme: th })}
//                 className={clsx(
//                   "flex-1 rounded-md border py-2 capitalize",
//                   settings.theme === th
//                     ? "border-accent bg-bg-elevated text-text-primary"
//                     : "border-border text-text-secondary hover:bg-bg-hover"
//                 )}
//               >
//                 {th}
//               </button>
//             ))}
//           </div>
//         </section>

//         <section className="mb-6 flex items-center justify-between">
//           <div>
//             <div className="text-text-primary">Opaque Mode</div>
//             <div className="text-[12px] text-text-muted">Solid background instead of transparency</div>
//           </div>
//           <button
//             onClick={() => update({ opaqueMode: !settings.opaqueMode })}
//             className={clsx(
//               "relative h-6 w-11 shrink-0 rounded-full transition-colors",
//               settings.opaqueMode ? "bg-accent" : "bg-bg-elevated"
//             )}
//           >
//             <span
//               className={clsx(
//                 "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
//                 settings.opaqueMode ? "translate-x-5" : "translate-x-0.5"
//               )}
//             />
//           </button>
//         </section>

//         <section>
//           <h3 className="mb-1 text-[15px] font-medium text-text-primary">Font Size</h3>
//           <div className="divide-y divide-border">
//             <FontStepper
//               label="Sidebar"
//               value={settings.fontSizes.sidebar}
//               onChange={(v) => update({ fontSizes: { ...settings.fontSizes, sidebar: v } })}
//             />
//             <FontStepper
//               label="Request Panel"
//               value={settings.fontSizes.request}
//               onChange={(v) => update({ fontSizes: { ...settings.fontSizes, request: v } })}
//             />
//             <FontStepper
//               label="Response Panel"
//               value={settings.fontSizes.response}
//               onChange={(v) => update({ fontSizes: { ...settings.fontSizes, response: v } })}
//             />
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }
import clsx from "clsx";
import { X, Minus, Plus } from "lucide-react";
import { useSettingsStore } from "@/stores/settingsStore";
import type { HttpMethod } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function FontStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-text-secondary">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(10, value - 1))} className="rounded p-1 text-text-secondary hover:bg-bg-hover">
          <Minus size={14} />
        </button>
        <span className="w-10 text-center text-text-primary">{value}px</span>
        <button onClick={() => onChange(Math.min(24, value + 1))} className="rounded p-1 text-text-secondary hover:bg-bg-hover">
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={clsx("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-accent" : "bg-bg-elevated")}
    >
      <span className={clsx("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
    </button>
  );
}

export function SettingsDrawer({ open, onClose }: Props) {
  const { settings, update, reset } = useSettingsStore();

  if (!open) return null;

  const handleReset = () => {
    if (window.confirm("Reset all settings to their defaults?")) reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div className="h-full w-[380px] overflow-y-auto border-l border-border bg-bg-panel p-5" onClick={(e) => e.stopPropagation()}>
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
                  settings.theme === th ? "border-accent bg-bg-elevated text-text-primary" : "border-border text-text-secondary hover:bg-bg-hover"
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
          <Toggle checked={settings.opaqueMode} onChange={(v) => update({ opaqueMode: v })} />
        </section>

        <section className="mb-6">
          <h3 className="mb-1 text-[15px] font-medium text-text-primary">Font Size</h3>
          <div className="divide-y divide-border">
            <FontStepper label="Sidebar" value={settings.fontSizes.sidebar} onChange={(v) => update({ fontSizes: { ...settings.fontSizes, sidebar: v } })} />
            <FontStepper label="Request Panel" value={settings.fontSizes.request} onChange={(v) => update({ fontSizes: { ...settings.fontSizes, request: v } })} />
            <FontStepper label="Response Panel" value={settings.fontSizes.response} onChange={(v) => update({ fontSizes: { ...settings.fontSizes, response: v } })} />
          </div>
        </section>

        <section className="mb-6 space-y-4">
          <h3 className="mb-1 text-[15px] font-medium text-text-primary">Other Preferences</h3>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary">Restore Last Session</div>
              <div className="text-[12px] text-text-muted">Reopen your tabs on startup</div>
            </div>
            <Toggle checked={settings.restoreLastSession} onChange={(v) => update({ restoreLastSession: v })} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Default Request Method</span>
            <select
              value={settings.defaultMethod}
              onChange={(e) => update({ defaultMethod: e.target.value as HttpMethod })}
              className="rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-text-primary focus:border-accent focus:outline-none"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-secondary">Default JSON Formatting</span>
            <div className="flex gap-1.5">
              {(["pretty", "compact"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => update({ defaultJsonFormat: f })}
                  className={clsx(
                    "rounded-md border px-2.5 py-1 text-[12px] capitalize",
                    settings.defaultJsonFormat === f ? "border-accent bg-bg-elevated text-text-primary" : "border-border text-text-secondary hover:bg-bg-hover"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary">Response Word Wrap</div>
              <div className="text-[12px] text-text-muted">Wrap long lines in Raw response view</div>
            </div>
            <Toggle checked={settings.responseWordWrap} onChange={(v) => update({ responseWordWrap: v })} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-text-primary">Confirm Before Closing</div>
              <div className="text-[12px] text-text-muted">Warn when closing a tab with unsaved changes</div>
            </div>
            <Toggle checked={settings.confirmBeforeClosingUnsavedTabs} onChange={(v) => update({ confirmBeforeClosingUnsavedTabs: v })} />
          </div>
        </section>

        <section className="border-t border-border pt-4">
          <button
            onClick={handleReset}
            className="w-full rounded-md border border-status-error/40 py-2 text-[13px] font-medium text-status-error hover:bg-status-error/10"
          >
            Reset All Settings
          </button>
        </section>
      </div>
    </div>
  );
}