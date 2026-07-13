import { invoke } from "@tauri-apps/api/core";
import type {
  ApiRequest,
  ApiResponse,
  Collection,
  Environment,
  HistoryEntry,
  AppSettings,
} from "@/types";
import type { MockRoute } from "@/stores/mockStore";

export interface ExecuteRequestPayload {
  request: ApiRequest;
  environmentId: string | null;
}

export const api = {
  http: {
    execute: (payload: ExecuteRequestPayload) => invoke<ApiResponse>("execute_request", { payload }),
    cancel: (requestId: string) => invoke<void>("cancel_request", { requestId }),
  },

  collections: {
    list: () => invoke<Collection[]>("list_collections"),
    create: (name: string, parentId: string | null) => invoke<Collection>("create_collection", { name, parentId }),
    rename: (id: string, name: string) => invoke<void>("rename_collection", { id, name }),
    delete: (id: string) => invoke<void>("delete_collection", { id }),
    reorder: (id: string, newParentId: string | null, position: number) =>
      invoke<void>("reorder_collection", { id, newParentId, position }),
  },

  requests: {
    listByCollection: (collectionId: string) => invoke<ApiRequest[]>("list_requests", { collectionId }),
    save: (request: ApiRequest) => invoke<ApiRequest>("save_request", { request }),
    delete: (id: string) => invoke<void>("delete_request", { id }),
  },

  history: {
    list: (limit: number, offset: number) => invoke<HistoryEntry[]>("list_history", { limit, offset }),
    search: (query: string) => invoke<HistoryEntry[]>("search_history", { query }),
    clear: () => invoke<void>("clear_history"),
  },

  environments: {
    list: () => invoke<Environment[]>("list_environments"),
    create: (name: string) => invoke<Environment>("create_environment", { name }),
    update: (env: Environment) => invoke<void>("update_environment", { env }),
    delete: (id: string) => invoke<void>("delete_environment", { id }),
    setActive: (id: string) => invoke<void>("set_active_environment", { id }),
  },

  settings: {
    get: () => invoke<AppSettings>("get_settings"),
    update: (settings: Partial<AppSettings>) => invoke<AppSettings>("update_settings", { settings }),
  },

  import: {
    fromUrl: (url: string) => invoke<Collection>("import_from_url", { url }),
    fromFile: (filePath: string) => invoke<Collection>("import_from_file", { filePath }),
  },

  tabs: {
    listPersisted: () => invoke<ApiRequest[]>("list_persisted_tabs"),
    persist: (requests: ApiRequest[]) => invoke<void>("persist_tabs", { requests }),
  },

  ws: {
    connect: (connectionId: string, url: string, headers: [string, string][]) =>
      invoke<void>("ws_connect", { connectionId, url, headers }),
    send: (connectionId: string, data: string, isBinary: boolean) =>
      invoke<void>("ws_send", { connectionId, data, isBinary }),
    disconnect: (connectionId: string) => invoke<void>("ws_disconnect", { connectionId }),
  },

  mock: {
    start: (port: number, routes: MockRoute[]) => invoke<void>("mock_start", { port, routes }),
    stop: () => invoke<void>("mock_stop"),
    updateRoutes: (routes: MockRoute[]) => invoke<void>("mock_update_routes", { routes }),
    status: () => invoke<{ running: boolean; port: number }>("mock_status"),
  },

  sse: {
    connect: (connectionId: string, url: string, headers: [string, string][]) =>
      invoke<void>("sse_connect", { connectionId, url, headers }),
    disconnect: (connectionId: string) => invoke<void>("sse_disconnect", { connectionId }),
    setPaused: (connectionId: string, paused: boolean) => invoke<void>("sse_set_paused", { connectionId, paused }),
  },
};