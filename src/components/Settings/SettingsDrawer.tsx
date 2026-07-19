import { useState } from "react";
import clsx from "clsx";
import { X, Minus, Plus, RotateCcw } from "lucide-react";
import { useSettingsStore, ZOOM_MIN, ZOOM_MAX } from "@/stores/settingsStore";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import type { HttpMethod } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function FontStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[12px]">
      <span className="text-text-secondary">{label}</span>
      <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded px-1 h-7">
        <button 
          onClick={() => onChange(Math.max(10, value - 1))} 
          className="rounded p-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-9 text-center font-mono font-medium text-text-primary text-[11px]">{value}px</span>
        <button 
          onClick={() => onChange(Math.min(24, value + 1))} 
          className="rounded p-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

function ZoomStepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[12px]">
      <span className="text-text-secondary">{label}</span>
      <div className="flex items-center gap-1 bg-bg-elevated border border-border rounded px-1 h-7">
        <button
          onClick={() => onChange(Math.max(ZOOM_MIN, value - 1))}
          className="rounded p-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Minus size={12} />
        </button>
        <span className="w-9 text-center font-mono font-medium text-text-primary text-[11px]">{value}</span>
        <button
          onClick={() => onChange(Math.min(ZOOM_MAX, value + 1))}
          className="rounded p-0.5 text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors"
        >
          <Plus size={12} />
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
      className={clsx(
        "relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out outline-none border border-transparent", 
        checked ? "bg-accent" : "bg-bg-elevated"
      )}
    >
      <span 
        className={clsx(
          "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out mt-[1px]", 
          checked ? "translate-x-4" : "translate-x-[2px]"
        )} 
      />
    </button>
  );
}

export function SettingsDrawer({ open, onClose }: Props) {
  const { settings, update, reset } = useSettingsStore();
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  if (!open) return null;

  const handleReset = () => setResetConfirmOpen(true);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 select-none backdrop-blur-xs" onClick={onClose}>
      <div 
        className="h-full w-[320px] overflow-y-auto border-l border-border bg-bg-panel p-4 flex flex-col justify-between" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h2 className="text-[14px] font-semibold tracking-wide text-text-primary">Settings</h2>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={16} />
            </button>
          </div>

          {/* Appearance Section */}
          <section className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Appearance</h3>
            <div className="flex gap-1.5 bg-bg-base border border-border p-1 rounded">
              {(["dark", "light"] as const).map((th) => (
                <button
                  key={th}
                  onClick={() => update({ theme: th })}
                  className={clsx(
                    "flex-1 rounded py-1 text-[11px] font-medium capitalize transition-all",
                    settings.theme === th 
                      ? "bg-[var(--c-181115)] text-accent border border-accent/20 shadow-inner" 
                      : "text-text-secondary border border-transparent hover:text-text-primary"
                  )}
                >
                  {th}
                </button>
              ))}
            </div>
          </section>

          {/* Layout Tweaks */}
          <section className="flex items-center justify-between rounded border border-border bg-bg-base/40 p-2.5">
            <div className="space-y-0.5">
              <div className="text-[12px] font-medium text-text-secondary leading-none">Opaque Mode</div>
              <div className="text-[10px] text-text-muted">Solid background interface surface</div>
            </div>
            <Toggle checked={settings.opaqueMode} onChange={(v) => update({ opaqueMode: v })} />
          </section>

          {/* Typography Engine Controls */}
          <section className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Font Dimension Metrics</h3>
            <div className="divide-y divide-border/60 rounded border border-border bg-bg-base/20 px-2.5">
              <FontStepper label="Sidebar Explorer" value={settings.fontSizes.sidebar} onChange={(v) => update({ fontSizes: { ...settings.fontSizes, sidebar: v } })} />
              <FontStepper label="Request Panel" value={settings.fontSizes.request} onChange={(v) => update({ fontSizes: { ...settings.fontSizes, request: v } })} />
              <FontStepper label="Response Viewport" value={settings.fontSizes.response} onChange={(v) => update({ fontSizes: { ...settings.fontSizes, response: v } })} />
            </div>
          </section>

          {/* Zoom Controls */}
          <section className="space-y-1.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Zoom Level</h3>
            <div className="divide-y divide-border/60 rounded border border-border bg-bg-base/20 px-2.5">
              <ZoomStepper label="Sidebar" value={settings.zoomLevels.sidebar} onChange={(v) => update({ zoomLevels: { ...settings.zoomLevels, sidebar: v } })} />
              <ZoomStepper label="Request Panel" value={settings.zoomLevels.request} onChange={(v) => update({ zoomLevels: { ...settings.zoomLevels, request: v } })} />
              <ZoomStepper label="Response Panel" value={settings.zoomLevels.response} onChange={(v) => update({ zoomLevels: { ...settings.zoomLevels, response: v } })} />
            </div>
            <p className="text-[10px] text-text-muted px-0.5">13 is default (medium). Scales the whole panel — layout, icons, and text.</p>
          </section>

          {/* Core Feature Configuration Toggles */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-text-muted">Preferences</h3>

            <div className="space-y-2.5 rounded border border-border bg-bg-base/20 p-2.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[12px] font-medium text-text-secondary leading-none">Restore Last Session</div>
                  <div className="text-[10px] text-text-muted">Reopen operational workspaces on boot</div>
                </div>
                <Toggle checked={settings.restoreLastSession} onChange={(v) => update({ restoreLastSession: v })} />
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-text-secondary">Default HTTP Method</span>
                <select
                  value={settings.defaultMethod}
                  onChange={(e) => update({ defaultMethod: e.target.value as HttpMethod })}
                  className="rounded border border-border bg-bg-elevated px-2 py-1 font-mono text-[11px] text-text-secondary outline-none focus:border-accent/50 cursor-pointer h-7"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-text-secondary">JSON Blueprint Style</span>
                <div className="flex bg-bg-elevated border border-border p-0.5 rounded h-7">
                  {(["pretty", "compact"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => update({ defaultJsonFormat: f })}
                      className={clsx(
                        "rounded px-2 text-[10px] font-medium capitalize transition-colors",
                        settings.defaultJsonFormat === f ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[12px] font-medium text-text-secondary leading-none">Response Word Wrap</div>
                  <div className="text-[10px] text-text-muted">Wrap trailing strings inside data stream views</div>
                </div>
                <Toggle checked={settings.responseWordWrap} onChange={(v) => update({ responseWordWrap: v })} />
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-[12px] font-medium text-text-secondary leading-none">Confirm Before Closing</div>
                  <div className="text-[10px] text-text-muted">Warn on closing tabs with staging state</div>
                </div>
                <Toggle checked={settings.confirmBeforeClosingUnsavedTabs} onChange={(v) => update({ confirmBeforeClosingUnsavedTabs: v })} />
              </div>
            </div>
          </section>
        </div>

        {/* Global Structural Settings Wipe Operation */}
        <section className="pt-4 mt-6 border-t border-border">
          <button
            onClick={handleReset}
            className="flex w-full items-center justify-center gap-1.5 rounded border border-rose-950/40 bg-rose-950/10 py-1.5 text-[11px] font-medium text-rose-400 transition-colors hover:bg-rose-950/20"
          >
            <RotateCcw size={12} />
            Reset Factory Defaults
          </button>
        </section>
      </div>

      <ConfirmModal
        open={resetConfirmOpen}
        title="Reset settings"
        message="This resets all settings to their defaults. This can't be undone."
        confirmLabel="Reset"
        onCancel={() => setResetConfirmOpen(false)}
        onConfirm={() => {
          reset();
          setResetConfirmOpen(false);
        }}
      />
    </div>
  );
}