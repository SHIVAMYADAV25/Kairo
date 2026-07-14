import { create } from "zustand";
import { useTabStore } from "@/stores/tabStore";
import { useSocketStore } from "@/stores/socketStore";
import type { RequestTab } from "@/types";

export type OpenTabKind = "http" | "websocket";

export interface OpenTabRef {
  key: string;
  kind: OpenTabKind;
  id: string;
}

function keyOf(kind: OpenTabKind, id: string) {
  return `${kind}:${id}`;
}

interface OpenTabsState {
  order: OpenTabRef[];
  activeKey: string | null;

  openHttpTab: (tab: RequestTab) => void;
  focusHttpTab: (id: string) => void;
  closeHttpTab: (id: string) => void;

  openSocketTab: (connectionId: string) => void;
  closeSocketTab: (connectionId: string) => void;

  moveTab: (from: number, to: number) => void;
}

export const useOpenTabsStore = create<OpenTabsState>((set) => ({
  order: [],
  activeKey: null,

  openHttpTab: (tab) => {
    useTabStore.getState().openTab(tab);
    const key = keyOf("http", tab.id);
    set((s) => (s.order.some((t) => t.key === key) ? { activeKey: key } : { order: [...s.order, { key, kind: "http", id: tab.id }], activeKey: key }));
  },

  focusHttpTab: (id) => {
    useTabStore.getState().setActiveTab(id);
    set({ activeKey: keyOf("http", id) });
  },

  closeHttpTab: (id) => {
    useTabStore.getState().closeTab(id);
    const key = keyOf("http", id);
    set((s) => {
      const idx = s.order.findIndex((t) => t.key === key);
      const order = s.order.filter((t) => t.key !== key);
      let activeKey = s.activeKey;
      if (activeKey === key) activeKey = order[Math.min(idx, order.length - 1)]?.key ?? null;
      return { order, activeKey };
    });
  },

  openSocketTab: (connectionId) => {
    const key = keyOf("websocket", connectionId);
    set((s) => (s.order.some((t) => t.key === key) ? { activeKey: key } : { order: [...s.order, { key, kind: "websocket", id: connectionId }], activeKey: key }));
  },

  closeSocketTab: (connectionId) => {
    useSocketStore.getState().removeConnection(connectionId);
    const key = keyOf("websocket", connectionId);
    set((s) => {
      const idx = s.order.findIndex((t) => t.key === key);
      const order = s.order.filter((t) => t.key !== key);
      let activeKey = s.activeKey;
      if (activeKey === key) activeKey = order[Math.min(idx, order.length - 1)]?.key ?? null;
      return { order, activeKey };
    });
  },

  moveTab: (from, to) => {
    set((s) => {
      const order = [...s.order];
      const [moved] = order.splice(from, 1);
      order.splice(to, 0, moved);
      return { order };
    });
  },
}));