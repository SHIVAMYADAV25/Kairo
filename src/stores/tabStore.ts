import { create } from "zustand";
import type { ApiRequest, ApiResponse, RequestTab } from "@/types";
import { createEmptyTab } from "@/lib/factories";
import { api } from "@/lib/api";
import { useCollectionStore } from "@/stores/collectionStore";

// Debounced auto-save: any edit to a request that already lives in a
// collection (tab.requestId set) quietly re-saves in the background instead
// of requiring the user to keep hitting the Save button. Keyed by tab id so
// rapid edits (typing in the URL/name/etc.) coalesce into a single save.
const AUTO_SAVE_DELAY_MS = 600;
const autoSaveTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function scheduleAutoSave(tabId: string) {
  if (autoSaveTimers[tabId]) clearTimeout(autoSaveTimers[tabId]);
  autoSaveTimers[tabId] = setTimeout(async () => {
    delete autoSaveTimers[tabId];
    const tab = useTabStore.getState().tabs.find((t) => t.id === tabId);
    if (!tab || !tab.requestId || !tab.request.collectionId) return;
    try {
      const saved = await api.requests.save(tab.request);
      // Re-check the tab still exists (it may have been closed while saving).
      if (!useTabStore.getState().tabs.some((t) => t.id === tabId)) return;
      useTabStore.getState().markSaved(tabId, saved.id, saved.name, saved.collectionId!);
      useCollectionStore.getState().upsertRequestInCache(saved);
    } catch (e) {
      console.error("[tabs] auto-save failed:", e);
    }
  }, AUTO_SAVE_DELAY_MS);
}

interface TabState {
  tabs: RequestTab[];
  activeTabId: string | null;

  openTab: (tab?: RequestTab) => void;
  closeTab: (id: string) => void;
  duplicateTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  renameTab: (id: string, title: string) => void;

  updateRequest: (id: string, patch: Partial<ApiRequest>) => void;
  markUnsaved: (id: string, unsaved: boolean) => void;
  markSaved: (id: string, requestId: string, title: string, collectionId: string) => void;
  /** Applies a change that originated *outside* this tab (e.g. renamed from
   * the Collections sidebar, or saved via another tab of the same request)
   * so every open tab for that request stays in sync without re-triggering
   * another save. */
  syncSavedRequest: (requestId: string, request: ApiRequest) => void;

  setLoading: (id: string, loading: boolean) => void;
  setResponse: (id: string, response: ApiResponse | null) => void;
  setError: (id: string, error: string | null) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) => {
    const newTab = tab ?? createEmptyTab();
    set((s) => ({ tabs: [...s.tabs, newTab], activeTabId: newTab.id }));
  },

  closeTab: (id) => {
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === id);
      const tabs = s.tabs.filter((t) => t.id !== id);
      let activeTabId = s.activeTabId;
      if (s.activeTabId === id) {
        const fallback = tabs[idx] ?? tabs[idx - 1] ?? tabs[0];
        activeTabId = fallback ? fallback.id : null;
      }
      return { tabs, activeTabId };
    });
  },

  duplicateTab: (id) => {
    const source = get().tabs.find((t) => t.id === id);
    if (!source) return;
    const copy: RequestTab = {
      ...source,
      id: crypto.randomUUID(),
      requestId: null,
      title: `${source.title} Copy`,
      isUnsaved: true,
      request: { ...source.request, id: crypto.randomUUID() },
    };
    set((s) => ({ tabs: [...s.tabs, copy], activeTabId: copy.id }));
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  // Renaming a tab (e.g. via the inline editor in the tab bar) is really just
  // renaming the underlying request — route it through updateRequest so the
  // title, the request.name, the sidebar cache, and the auto-save all stay
  // in lockstep instead of drifting apart.
  renameTab: (id, title) => get().updateRequest(id, { name: title }),

  updateRequest: (id, patch) => {
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              request: { ...t.request, ...patch },
              // Keep the tab-bar title glued to request.name so renaming
              // (from anywhere) shows up immediately, "auto-save" style.
              title: patch.name !== undefined ? patch.name : t.title,
              isUnsaved: true,
            }
          : t
      ),
    }));

    const tab = get().tabs.find((t) => t.id === id);
    if (!tab) return;

    // Live-sync into the Collections sidebar cache so method/name changes
    // (e.g. switching PATCH -> PUT, or renaming) show up there instantly,
    // without waiting for a save round-trip.
    if (tab.requestId && tab.request.collectionId) {
      useCollectionStore.getState().upsertRequestInCache(tab.request);
      scheduleAutoSave(id);
    }
  },

  markUnsaved: (id, unsaved) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, isUnsaved: unsaved } : t)) })),

  markSaved: (id, requestId, title, collectionId) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? {
              ...t,
              requestId,
              title,
              isUnsaved: false,
              request: { ...t.request, id: requestId, name: title, collectionId },
            }
          : t
      ),
    })),

  syncSavedRequest: (requestId, request) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.requestId === requestId
          ? { ...t, title: request.name, request, isUnsaved: false }
          : t
      ),
    })),

  setLoading: (id, loading) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, isLoading: loading } : t)) })),

  setResponse: (id, response) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, response } : t)) })),

  setError: (id, error) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, error } : t)) })),
}));