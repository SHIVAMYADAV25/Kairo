import { create } from "zustand";
import type { AppSettings } from "@/types";
import { api } from "@/lib/api";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  opaqueMode: true,
  fontSizes: { sidebar: 15, request: 13, response: 12 },
  panelSizes: {
    sidebarWidth: 260,
    requestEditorHeight: 340,
    responseViewerHeight: 420,
    performancePanelWidth: 280,
  },
  lastEnvironmentId: null,
  lastCollectionId: null,
};

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => void;
}

let debounceHandle: ReturnType<typeof setTimeout> | null = null;

function applyDomTheme(settings: AppSettings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.opaque = String(settings.opaqueMode);
  root.style.setProperty("--font-sidebar", `${settings.fontSizes.sidebar}px`);
  root.style.setProperty("--font-request", `${settings.fontSizes.request}px`);
  root.style.setProperty("--font-response", `${settings.fontSizes.response}px`);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    try {
      const settings = await api.settings.get();
      applyDomTheme(settings);
      set({ settings, hydrated: true });
    } catch {
      // First run / backend not ready yet — fall back to defaults.
      applyDomTheme(DEFAULT_SETTINGS);
      set({ hydrated: true });
    }
  },

  update: (patch) => {
    const next = { ...get().settings, ...patch };
    applyDomTheme(next);
    set({ settings: next });

    // Debounced persistence so dragging a slider doesn't spam SQLite writes.
    if (debounceHandle) clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      api.settings.update(patch).catch(console.error);
    }, 300);
  },
}));