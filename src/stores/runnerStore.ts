import { create } from "zustand";
import type { ApiRequest, ApiResponse } from "@/types";
import { api } from "@/lib/api";

export interface RunnerResult {
  requestId: string;
  name: string;
  method: string;
  url: string;
  status: "pending" | "running" | "passed" | "failed" | "error" | "skipped";
  response: ApiResponse | null;
  error: string | null;
  durationMs: number;
}

interface RunnerState {
  isRunning: boolean;
  results: RunnerResult[];
  delayMs: number;
  stopRequested: boolean;
  setDelay: (ms: number) => void;
  run: (requests: ApiRequest[], environmentId: string | null) => Promise<void>;
  stop: () => void;
  reset: () => void;
}

export const useRunnerStore = create<RunnerState>((set, get) => ({
  isRunning: false,
  results: [],
  delayMs: 300,
  stopRequested: false,

  setDelay: (ms) => set({ delayMs: ms }),
  reset: () => set({ results: [], stopRequested: false }),
  stop: () => set({ stopRequested: true }),

  run: async (requests, environmentId) => {
    const initial: RunnerResult[] = requests.map((r) => ({
      requestId: r.id,
      name: r.name,
      method: r.method,
      url: r.url,
      status: "pending",
      response: null,
      error: null,
      durationMs: 0,
    }));
    set({ isRunning: true, results: initial, stopRequested: false });

    for (let i = 0; i < requests.length; i++) {
      if (get().stopRequested) {
        set((s) => ({ results: s.results.map((r, idx) => (idx >= i ? { ...r, status: "skipped" } : r)) }));
        break;
      }

      set((s) => ({ results: s.results.map((r, idx) => (idx === i ? { ...r, status: "running" } : r)) }));
      const start = performance.now();

      try {
        // execute_request already runs pre-request/test scripts and persists
        // any environment variable changes back to storage — so a later
        // request in the same run automatically sees variables an earlier
        // one set via `pm.environment.set(...)`, for free.
        const response = await api.http.execute({ request: requests[i], environmentId });
        const durationMs = Math.round(performance.now() - start);
        const failedTests = response.testResults.filter((t) => !t.passed).length;
        const status: RunnerResult["status"] =
          response.status >= 200 && response.status < 400 && failedTests === 0 ? "passed" : "failed";
        set((s) => ({ results: s.results.map((r, idx) => (idx === i ? { ...r, status, response, durationMs } : r)) }));
      } catch (e) {
        const durationMs = Math.round(performance.now() - start);
        set((s) => ({
          results: s.results.map((r, idx) =>
            idx === i ? { ...r, status: "error", error: e instanceof Error ? e.message : String(e), durationMs } : r
          ),
        }));
      }

      if (get().delayMs > 0 && i < requests.length - 1) {
        await new Promise((res) => setTimeout(res, get().delayMs));
      }
    }

    set({ isRunning: false });
  },
}));