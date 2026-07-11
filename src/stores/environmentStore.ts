import { create } from "zustand";
import type { Environment } from "@/types";
import { api } from "@/lib/api";

interface EnvironmentState {
  environments: Environment[];
  activeEnvironmentId: string | null;
  load: () => Promise<void>;
  setActive: (id: string | null) => Promise<void>;
  create: (name: string) => Promise<void>;
  update: (env: Environment) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useEnvironmentStore = create<EnvironmentState>((set, get) => ({
  environments: [],
  activeEnvironmentId: null,

  load: async () => {
    const environments = await api.environments.list();
    const active = environments.find((e) => e.isActive);
    set({ environments, activeEnvironmentId: active?.id ?? null });
  },

  setActive: async (id) => {
    if (id) await api.environments.setActive(id);
    set({ activeEnvironmentId: id });
  },

  create: async (name) => {
    const env = await api.environments.create(name);
    set((s) => ({ environments: [...s.environments, env] }));
  },

  update: async (env) => {
    await api.environments.update(env);
    set((s) => ({ environments: s.environments.map((e) => (e.id === env.id ? env : e)) }));
  },

  remove: async (id) => {
    await api.environments.delete(id);
    set((s) => ({
      environments: s.environments.filter((e) => e.id !== id),
      activeEnvironmentId: get().activeEnvironmentId === id ? null : get().activeEnvironmentId,
    }));
  },
}));
