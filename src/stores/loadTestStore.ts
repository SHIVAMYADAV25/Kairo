import { create } from "zustand";
import { listen } from "@tauri-apps/api/event";
import { api } from "@/lib/api";
import type { LoadTestConfig, LoadTestProgress } from "@/types/loadtest";

export interface LoadTestState {
  isRunning: boolean;
  testId: string | null;
  progress: LoadTestProgress | null;
  history: LoadTestProgress[];
  listenersReady: boolean;

  ensureListeners: () => void;
  run: (config: LoadTestConfig) => Promise<void>;
  stop: () => Promise<void>;
  reset: () => void;
}

export const useLoadTestStore = create<LoadTestState>((set, get) => ({
  isRunning: false,
  testId: null,
  progress: null,
  history: [],
  listenersReady: false,

  ensureListeners: () => {
    if (get().listenersReady) return;
    set({ listenersReady: true });
    listen<LoadTestProgress>("loadtest-progress", (event) => {
      const p = event.payload;
      if (p.testId !== get().testId) return;
      set((s) => ({ progress: p, history: [...s.history, p].slice(-120), isRunning: !p.done }));
    });
  },

  run: async (config) => {
    set({ isRunning: true, testId: config.testId, progress: null, history: [] });
    try {
      await api.loadTest.run(config);
    } catch (e) {
      set({ isRunning: false });
      throw e;
    }
  },

  stop: async () => {
    const testId = get().testId;
    if (testId) await api.loadTest.stop(testId);
    set({ isRunning: false });
  },

  reset: () => set({ isRunning: false, testId: null, progress: null, history: [] }),
}));