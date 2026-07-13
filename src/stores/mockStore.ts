import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";
import { uid } from "@/lib/factories";

export interface MockHeader {
  key: string;
  value: string;
}

export interface MockRoute {
  id: string;
  method: string;
  path: string;
  status: number;
  delayMs: number;
  enabled: boolean;
  description: string;
  responseBody: string;
  responseHeaders: MockHeader[];
}

export interface MockLogEntry {
  id: string;
  method: string;
  path: string;
  matched: boolean;
  status: number;
  durationMs: number;
  timestamp: string;
}

interface MockState {
  routes: MockRoute[];
  running: boolean;
  port: number;
  log: MockLogEntry[];
  listenersReady: boolean;
  ensureListeners: () => void;
  addRoute: (route: Omit<MockRoute, "id">) => void;
  updateRoute: (id: string, patch: Partial<MockRoute>) => void;
  deleteRoute: (id: string) => void;
  setPort: (port: number) => void;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  clearLog: () => void;
}

function defaultRoute(): MockRoute {
  return {
    id: uid(),
    method: "GET",
    path: "/",
    status: 200,
    delayMs: 0,
    enabled: true,
    description: "",
    responseBody: '{"message": "Hello", "id": "{{$uuid}}"}',
    responseHeaders: [],
  };
}

export const useMockStore = create<MockState>((set, get) => ({
  routes: [defaultRoute()],
  running: false,
  port: 8765,
  log: [],
  listenersReady: false,

  ensureListeners: () => {
    if (get().listenersReady) return;
    set({ listenersReady: true });
    listen<MockLogEntry>("mock-request", (event) => {
      set((s) => ({ log: [{ ...event.payload, id: uid() }, ...s.log].slice(0, 200) }));
    });
  },

  addRoute: (route) => {
    set((s) => ({ routes: [...s.routes, { ...route, id: uid() }] }));
    if (get().running) api.mock.updateRoutes(get().routes).catch(console.error);
  },

  updateRoute: (id, patch) => {
    set((s) => ({ routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
    if (get().running) api.mock.updateRoutes(get().routes).catch(console.error);
  },

  deleteRoute: (id) => {
    set((s) => ({ routes: s.routes.filter((r) => r.id !== id) }));
    if (get().running) api.mock.updateRoutes(get().routes).catch(console.error);
  },

  setPort: (port) => set({ port }),

  start: async () => {
    await api.mock.start(get().port, get().routes);
    set({ running: true });
  },

  stop: async () => {
    await api.mock.stop();
    set({ running: false });
  },

  clearLog: () => set({ log: [] }),
}));