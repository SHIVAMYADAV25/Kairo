import { create } from "zustand";
import type { ApiRequest, ApiResponse, RequestTab } from "@/types";
import { createEmptyTab } from "@/lib/factories";

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

  renameTab: (id, title) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, title } : t)) })),

  updateRequest: (id, patch) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === id
          ? { ...t, request: { ...t.request, ...patch }, isUnsaved: true }
          : t
      ),
    })),

  markUnsaved: (id, unsaved) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, isUnsaved: unsaved } : t)) })),

  setLoading: (id, loading) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, isLoading: loading } : t)) })),

  setResponse: (id, response) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, response } : t)) })),

  setError: (id, error) =>
    set((s) => ({ tabs: s.tabs.map((t) => (t.id === id ? { ...t, error } : t)) })),
}));
