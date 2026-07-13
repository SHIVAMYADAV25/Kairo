import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";
import { uid } from "@/lib/factories";

export interface SocketMessage {
  id: string;
  direction: "sent" | "received";
  isBinary: boolean;
  data: string;
  timestamp: string;
}

export type SocketStatus = "disconnected" | "connecting" | "open" | "closed" | "error";

export interface SocketHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface SocketConnection {
  id: string;
  name: string;
  url: string;
  headers: SocketHeader[];
  status: SocketStatus;
  statusMessage: string | null;
  messages: SocketMessage[];
  autoReconnect: boolean;
}

interface SocketState {
  connections: SocketConnection[];
  activeConnectionId: string | null;
  listenersReady: boolean;
  ensureListeners: () => void;
  addConnection: () => string;
  removeConnection: (id: string) => void;
  setActive: (id: string) => void;
  updateConnection: (id: string, patch: Partial<SocketConnection>) => void;
  connect: (id: string) => Promise<void>;
  disconnect: (id: string) => Promise<void>;
  send: (id: string, data: string, isBinary?: boolean) => Promise<void>;
  clearMessages: (id: string) => void;
}

function newConnection(): SocketConnection {
  return {
    id: uid(),
    name: "New Connection",
    url: "wss://echo.websocket.org",
    headers: [],
    status: "disconnected",
    statusMessage: null,
    messages: [],
    autoReconnect: false,
  };
}

export const useSocketStore = create<SocketState>((set, get) => ({
  connections: [],
  activeConnectionId: null,
  listenersReady: false,

  ensureListeners: () => {
    if (get().listenersReady) return;
    set({ listenersReady: true });

    listen<{ connectionId: string; isBinary: boolean; data: string; timestamp: string }>("ws-message", (event) => {
      const { connectionId, isBinary, data, timestamp } = event.payload;
      set((s) => ({
        connections: s.connections.map((c) =>
          c.id === connectionId
            ? { ...c, messages: [...c.messages, { id: uid(), direction: "received", isBinary, data, timestamp }] }
            : c
        ),
      }));
    });

    listen<{ connectionId: string; status: SocketStatus; message: string | null }>("ws-status", (event) => {
      const { connectionId, status, message } = event.payload;
      set((s) => ({
        connections: s.connections.map((c) => (c.id === connectionId ? { ...c, status, statusMessage: message } : c)),
      }));

      // Auto-reconnect on an unexpected close/error — never after a manual
      // disconnect, which turns autoReconnect off first (see disconnect()).
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
    get().updateConnection(id, { status: "connecting", statusMessage: null });
    const headers: [string, string][] = conn.headers.filter((h) => h.enabled && h.key).map((h) => [h.key, h.value]);
    try {
      await api.ws.connect(id, conn.url, headers);
    } catch (e) {
      get().updateConnection(id, { status: "error", statusMessage: e instanceof Error ? e.message : String(e) });
    }
  },

  disconnect: async (id) => {
    get().updateConnection(id, { autoReconnect: false });
    try {
      await api.ws.disconnect(id);
    } catch {
      /* already gone */
    }
  },

  send: async (id, data, isBinary = false) => {
    const conn = get().connections.find((c) => c.id === id);
    if (!conn || conn.status !== "open") return;
    set((s) => ({
      connections: s.connections.map((c) =>
        c.id === id
          ? { ...c, messages: [...c.messages, { id: uid(), direction: "sent", isBinary, data, timestamp: new Date().toISOString() }] }
          : c
      ),
    }));
    try {
      await api.ws.send(id, data, isBinary);
    } catch (e) {
      console.error("[ws] send failed:", e);
    }
  },

  clearMessages: (id) => set((s) => ({ connections: s.connections.map((c) => (c.id === id ? { ...c, messages: [] } : c)) })),
}));