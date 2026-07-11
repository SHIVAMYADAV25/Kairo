import { invoke } from "@tauri-apps/api/core";
import type {
  ApiRequest,
  ApiResponse,
  Collection,
  Environment,
  HistoryEntry,
  AppSettings,
} from "@/types";

// ---------------------------------------------------------------------------
// Every Tauri command is wrapped here with a proper TS signature. Nothing
// outside this file should call `invoke` directly — this is the seam that
// lets us add features (Runner, Sockets, Mocks) without touching components.
// ---------------------------------------------------------------------------

export interface ExecuteRequestPayload {
  request: ApiRequest;
  environmentId: string | null;
}

export const api = {
  http: {
    /** Runs pre-request script → var substitution → HTTP call → tests, in Rust. */
    execute: (payload: ExecuteRequestPayload) =>
      invoke<ApiResponse>("execute_request", { payload }),
    cancel: (requestId: string) => invoke<void>("cancel_request", { requestId }),
  },

  collections: {
    list: () => invoke<Collection[]>("list_collections"),
    create: (name: string, parentId: string | null) =>
      invoke<Collection>("create_collection", { name, parentId }),
    rename: (id: string, name: string) => invoke<void>("rename_collection", { id, name }),
    delete: (id: string) => invoke<void>("delete_collection", { id }),
    reorder: (id: string, newParentId: string | null, position: number) =>
      invoke<void>("reorder_collection", { id, newParentId, position }),
  },

  requests: {
    listByCollection: (collectionId: string) =>
      invoke<ApiRequest[]>("list_requests", { collectionId }),
    save: (request: ApiRequest) => invoke<ApiRequest>("save_request", { request }),
    delete: (id: string) => invoke<void>("delete_request", { id }),
  },

  history: {
    list: (limit: number, offset: number) =>
      invoke<HistoryEntry[]>("list_history", { limit, offset }),
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
    update: (settings: Partial<AppSettings>) =>
      invoke<AppSettings>("update_settings", { settings }),
  },

  import: {
    fromUrl: (url: string) => invoke<Collection>("import_from_url", { url }),
    fromFile: (filePath: string) => invoke<Collection>("import_from_file", { filePath }),
  },

  tabs: {
    listPersisted: () => invoke<ApiRequest[]>("list_persisted_tabs"),
    persist: (tabIds: string[]) => invoke<void>("persist_tabs", { tabIds }),
  },
};
