import { create } from "zustand";
import type { AppSettings } from "@/types";
import { api } from "@/lib/api";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  opaqueMode: true,
  fontSizes: { sidebar: 15, request: 13, response: 12 },
  panelSizes: {
    sidebarWidth: 260,
    requestEditorHeight: 260, // Adjusted down from 340 so the top builder doesn't push the response panel away on first mount
    responseViewerHeight: 420,
    performancePanelWidth: 280,
  },
  lastEnvironmentId: null,
  lastCollectionId: null,
  restoreLastSession: true,
  defaultMethod: "GET",
  defaultJsonFormat: "pretty",
  responseWordWrap: false,
  confirmBeforeClosingUnsavedTabs: true,
};

interface SettingsState {
  settings: AppSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
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
      applyDomTheme(DEFAULT_SETTINGS);
      set({ hydrated: true });
    }
  },

  update: (patch) => {
    const next = { ...get().settings, ...patch };
    applyDomTheme(next);
    set({ settings: next });

    if (debounceHandle) clearTimeout(debounceHandle);
    debounceHandle = setTimeout(() => {
      api.settings.update(patch).catch(console.error);
    }, 300);
  },

  reset: () => {
    applyDomTheme(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
    api.settings.update(DEFAULT_SETTINGS).catch(console.error);
  },
}));