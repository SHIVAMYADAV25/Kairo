import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";
import { uid } from "@/lib/factories";

export interface SseHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface SseEvent {
  id: string;
  eventType: string;
  data: string;
  eventId: string | null;
  timestamp: string;
}

export type SseStatus = "disconnected" | "connecting" | "open" | "closed" | "error";

export interface SseConnection {
  id: string;
  name: string;
  url: string;
  headers: SseHeader[];
  status: SseStatus;
  statusMessage: string | null;
  events: SseEvent[];
  paused: boolean;
  autoReconnect: boolean;
}

interface SseState {
  connections: SseConnection[];
  activeConnectionId: string | null;
  listenersReady: boolean;
  ensureListeners: () => void;
  addConnection: () => string;
  removeConnection: (id: string) => void;
  setActive: (id: string) => void;
  updateConnection: (id: string, patch: Partial<SseConnection>) => void;
  connect: (id: string) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  togglePause: (id: string) => Promise<void>;
  clearEvents: (id: string) => void;
}

function newConnection(): SseConnection {
  return {
    id: uid(),
    name: "New Stream",
    url: "https://example.com/events",
    headers: [],
    status: "disconnected",
    statusMessage: null,
    events: [],
    paused: false,
    autoReconnect: false,
  };
}

export const useSseStore = create<SseState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  listenersReady: false,

  ensureListeners: () => {
    if (get().listenersReady) return;
    set({ listenersReady: true });

    listen<{ connectionId: string; eventType: string; data: string; id: string | null; timestamp: string }>("sse-event", (event) => {
      const { connectionId, eventType, data, id, timestamp } = event.payload;
      set((s) => ({
        connections: s.connections.map((c) =>
          c.id === connectionId
            ? { ...c, events: [...c.events, { id: uid(), eventType, data, eventId: id, timestamp }].slice(-500) }
            : c
        ),
      }));
    });

    listen<{ connectionId: string; status: SseStatus; message: string | null }>("sse-status", (event) => {
      const { connectionId, status, message } = event.payload;
      set((s) => ({
        connections: s.connections.map((c) => (c.id === connectionId ? { ...c, status, statusMessage: message } : c)),
      }));

      if (status === "closed" || status === "error") {
        setTimeout(() => {
          const conn = get().connections.find((c) => c.id === connectionId);
          if (conn && conn.autoReconnect && conn.status !== "open" && conn.status !== "connecting") {
            get().connect(connectionId).catch(() => {});
          }
        }, 2000);
      }
    });
  },

  addConnection: () => {
    const conn = newConnection();
    set((s) => ({ connections: [...s.connections, conn], activeConnectionId: conn.id }));
    return conn.id;
  },

  removeConnection: (id) => {
    get().disconnect(id).catch(() => {});
    set((s) => {
      const connections = s.connections.filter((c) => c.id !== id);
      const activeConnectionId = s.activeConnectionId === id ? connections[0]?.id ?? null : s.activeConnectionId;
      return { connections, activeConnectionId };
    });
  },

  setActive: (id) => set({ activeConnectionId: id }),

  updateConnection: (id, patch) =>
    set((s) => ({ connections: s.connections.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),

  connect: async (id) => {
    const conn = get().connections.find((c) => c.id === id);
    if (!conn) return;
    get().updateConnection(id, { status: "connecting", statusMessage: null, paused: false });
    const headers: [string, string][] = conn.headers.filter((h) => h.enabled && h.key).map((h) => [h.key, h.value]);
    try {
      await api.sse.connect(id, conn.url, headers);
    } catch (e) {
      get().updateConnection(id, { status: "error", statusMessage: e instanceof Error ? e.message : String(e) });
    }
  },

  disconnect: async (id) => {
    get().updateConnection(id, { autoReconnect: false });
    try {
      await api.sse.disconnect(id);
    } catch {
      /* already gone */
    }
  },

  togglePause: async (id) => {
    const conn = get().connections.find((c) => c.id === id);
    if (!conn || conn.status !== "open") return;
    const paused = !conn.paused;
    get().updateConnection(id, { paused });
    try {
      await api.sse.setPaused(id, paused);
    } catch (e) {
      console.error("[sse] pause toggle failed:", e);
    }
  },

  clearEvents: (id) => set((s) => ({ connections: s.connections.map((c) => (c.id === id ? { ...c, events: [] } : c)) })),
}));