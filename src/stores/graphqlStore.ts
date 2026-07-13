import { create } from "zustand";
import { api } from "@/lib/api";
import { uid } from "@/lib/factories";
import type { ApiRequest, ApiResponse } from "@/types";
import { INTROSPECTION_QUERY, parseIntrospection, type GraphqlSchema } from "@/lib/graphql";

export interface GraphqlHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface GraphqlOperation {
  id: string;
  name: string;
  endpoint: string;
  query: string;
  variables: string;
  headers: GraphqlHeader[];
  response: ApiResponse | null;
  isLoading: boolean;
  error: string | null;
  schema: GraphqlSchema | null;
  schemaLoading: boolean;
  schemaError: string | null;
}

interface GraphqlState {
  operations: GraphqlOperation[];
  activeOperationId: string | null;
  addOperation: () => string;
  removeOperation: (id: string) => void;
  setActive: (id: string) => void;
  updateOperation: (id: string, patch: Partial<GraphqlOperation>) => void;
  execute: (id: string, environmentId: string | null) => Promise<void>;
  fetchSchema: (id: string, environmentId: string | null) => Promise<void>;
}

function buildHttpRequest(op: GraphqlOperation): ApiRequest {
  let variables: unknown = {};
  try {
    variables = op.variables.trim() ? JSON.parse(op.variables) : {};
  } catch {
    variables = {};
  }
  return {
    id: uid(),
    collectionId: null,
    name: op.name,
    method: "POST",
    url: op.endpoint,
    params: [],
    headers: [
      { id: uid(), key: "Content-Type", value: "application/json", enabled: true },
      ...op.headers.filter((h) => h.enabled && h.key).map((h) => ({ id: uid(), key: h.key, value: h.value, enabled: true })),
    ],
    body: { type: "json", json: JSON.stringify({ query: op.query, variables }, null, 2) },
    auth: { type: "none" },
    scripts: { preRequest: "", tests: "" },
    settings: { timeoutMs: 30000, followRedirects: true, maxRedirects: 5, sslVerification: true, saveCookies: true },
    updatedAt: new Date().toISOString(),
  };
}

function newOperation(): GraphqlOperation {
  return {
    id: uid(),
    name: "New Operation",
    endpoint: "https://countries.trevorblades.com/graphql",
    query: "query {\n  \n}",
    variables: "{}",
    headers: [],
    response: null,
    isLoading: false,
    error: null,
    schema: null,
    schemaLoading: false,
    schemaError: null,
  };
}

export const useGraphqlStore = create<GraphqlState>((set, get) => ({
  operations: [],
  activeOperationId: null,

  addOperation: () => {
    const op = newOperation();
    set((s) => ({ operations: [...s.operations, op], activeOperationId: op.id }));
    return op.id;
  },

  removeOperation: (id) =>
    set((s) => {
      const operations = s.operations.filter((o) => o.id !== id);
      const activeOperationId = s.activeOperationId === id ? operations[0]?.id ?? null : s.activeOperationId;
      return { operations, activeOperationId };
    }),

  setActive: (id) => set({ activeOperationId: id }),

  updateOperation: (id, patch) => set((s) => ({ operations: s.operations.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),

  execute: async (id, environmentId) => {
    const op = get().operations.find((o) => o.id === id);
    if (!op) return;
    get().updateOperation(id, { isLoading: true, error: null });
    try {
      const response = await api.http.execute({ request: buildHttpRequest(op), environmentId });
      get().updateOperation(id, { response, isLoading: false });
    } catch (e) {
      get().updateOperation(id, { error: e instanceof Error ? e.message : String(e), isLoading: false, response: null });
    }
  },

  fetchSchema: async (id, environmentId) => {
    const op = get().operations.find((o) => o.id === id);
    if (!op) return;
    get().updateOperation(id, { schemaLoading: true, schemaError: null });
    try {
      const introspectionOp = { ...op, query: INTROSPECTION_QUERY, variables: "{}" };
      const response = await api.http.execute({ request: buildHttpRequest(introspectionOp), environmentId });
      const json = JSON.parse(response.body);
      if (json.errors) throw new Error(json.errors[0]?.message ?? "Introspection failed");
      const schema = parseIntrospection(json);
      get().updateOperation(id, { schema, schemaLoading: false });
    } catch (e) {
      get().updateOperation(id, { schemaError: e instanceof Error ? e.message : String(e), schemaLoading: false });
    }
  },
}));