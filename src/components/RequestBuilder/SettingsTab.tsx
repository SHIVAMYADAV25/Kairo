import type { RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button" // Prevents accidental form submissions if placed inside a form
      onClick={() => onChange(!checked)}
      className={`flex h-5 w-9 items-center rounded-full px-0.5 transition-colors duration-200 ${
        checked ? "bg-[#F54900] " : "bg-bg-elevated"
      }`}
    >
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface Props {
  tab: RequestTab;
}

export function SettingsTab({ tab }: Props) {
  const { updateRequest } = useTabStore();
  const settings = tab.request.settings;

  const setSettings = (patch: Partial<typeof settings>) =>
    updateRequest(tab.id, { settings: { ...settings, ...patch } });

  return (
    <div className="max-w-md space-y-5 p-4 text-[13px]">
      <label className="flex items-center justify-between">
        <span className="text-text-secondary">Timeout (ms)</span>
        <input
          type="number"
          value={settings.timeoutMs}
          onChange={(e) => setSettings({ timeoutMs: Number(e.target.value) })}
          className="w-28 rounded-md border border-border bg-bg-elevated px-2 py-1 text-right text-text-primary focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-text-secondary">Follow Redirects</span>
        <Toggle
          checked={settings.followRedirects}
          onChange={(v) => setSettings({ followRedirects: v })}
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-text-secondary">Max Redirects</span>
        <input
          type="number"
          value={settings.maxRedirects}
          onChange={(e) => setSettings({ maxRedirects: Number(e.target.value) })}
          className="w-28 rounded-md border border-border bg-bg-elevated px-2 py-1 text-right text-text-primary focus:border-accent focus:outline-none"
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-text-secondary">SSL Verification</span>
        <Toggle
          checked={settings.sslVerification}
          onChange={(v) => setSettings({ sslVerification: v })}
        />
      </label>

      <label className="flex items-center justify-between">
        <span className="text-text-secondary">Save Cookies</span>
        <Toggle checked={settings.saveCookies} onChange={(v) => setSettings({ saveCookies: v })} />
      </label>
    </div>
  );
}
