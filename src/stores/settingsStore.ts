import { create } from "zustand";
import type { AppSettings } from "@/types";
import { api } from "@/lib/api";

// The "no zoom" baseline. A zoom level of 13 always renders a panel at its
// normal (100%) scale — raising/lowering the level scales up/down from there.
export const ZOOM_BASE = 12;
export const ZOOM_MIN = 8;
export const ZOOM_MAX = 20;

const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  opaqueMode: true,
  fontSizes: { sidebar: 12, request: 12, response: 12 },
  zoomLevels: { sidebar: ZOOM_BASE, request: ZOOM_BASE, response: ZOOM_BASE },
  panelSizes: {
    sidebarWidth: 230,
    requestEditorHeight: 480, // Gives the request builder roughly half the window by default so the response panel (which fills the rest via flex-1) doesn't dominate on first load
    responseViewerHeight: 420,
    performancePanelWidth: 240,
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
  root.style.setProperty("--zoom-sidebar", `${settings.zoomLevels.sidebar / ZOOM_BASE}`);
  root.style.setProperty("--zoom-request", `${settings.zoomLevels.request / ZOOM_BASE}`);
  root.style.setProperty("--zoom-response", `${settings.zoomLevels.response / ZOOM_BASE}`);
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: async () => {
    try {
      const settings = await api.settings.get();
      // Migration guard: settings saved before the response panel switched to
      // filling all remaining space (flex-1) may have a very small request
      // editor height, which would now make the response panel dominate the
      // screen. Bump it back up to a sane minimum just once.
      const MIN_REQUEST_EDITOR_HEIGHT = 380;
      if (settings.panelSizes.requestEditorHeight < MIN_REQUEST_EDITOR_HEIGHT) {
        settings.panelSizes = { ...settings.panelSizes, requestEditorHeight: 480 };
        api.settings.update({ panelSizes: settings.panelSizes }).catch(() => {});
      }
      // Migration guard: settings persisted before zoom existed won't have
      // zoomLevels at all — backfill with the neutral default so panels
      // don't render at NaN scale.
      if (!settings.zoomLevels) {
        settings.zoomLevels = { sidebar: ZOOM_BASE, request: ZOOM_BASE, response: ZOOM_BASE };
        api.settings.update({ zoomLevels: settings.zoomLevels }).catch(() => {});
      }
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