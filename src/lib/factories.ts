// import type { ApiRequest, RequestTab } from "@/types";

// export const uid = () =>
//   crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

// export function createEmptyRequest(collectionId: string | null = null): ApiRequest {
//   return {
//     id: uid(),
//     collectionId,
//     name: "New Request",
//     method: "GET",
//     url: "",
//     params: [],
//     headers: [],
//     body: { type: "none" },
//     auth: { type: "none" },
//     scripts: { preRequest: "", tests: "" },
//     settings: {
//       timeoutMs: 30000,
//       followRedirects: true,
//       maxRedirects: 5,
//       sslVerification: true,
//       saveCookies: true,
//     },
//     updatedAt: new Date().toISOString(),
//   };
// }

// export function createEmptyTab(): RequestTab {
//   const request = createEmptyRequest();
//   return {
//     id: uid(),
//     requestId: null,
//     title: "New Request",
//     isUnsaved: false,
//     request,
//     response: null,
//     isLoading: false,
//     error: null,
//   };
// }

// /** Builds a tab for a request that's already saved in a collection (fix #1:
//  * clicking a request in the Collections tree needs to open *that* request,
//  * fully hydrated and marked as saved — not a blank "New Request" tab). */
// export function createTabFromRequest(request: ApiRequest): RequestTab {
//   return {
//     id: uid(),
//     requestId: request.id,
//     title: request.name,
//     isUnsaved: false,
//     request,
//     response: null,
//     isLoading: false,
//     error: null,
//   };
// }

import type { ApiRequest, HttpMethod, RequestTab } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";

export const uid = () =>
  crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

export function createEmptyRequest(collectionId: string | null = null): ApiRequest {
  const defaultMethod = (useSettingsStore.getState().settings.defaultMethod ?? "GET") as HttpMethod;
  return {
    id: uid(),
    collectionId,
    name: "New Request",
    method: defaultMethod,
    url: "",
    params: [],
    headers: [],
    body: { type: "none" },
    auth: { type: "none" },
    scripts: { preRequest: "", tests: "" },
    settings: {
      timeoutMs: 30000,
      followRedirects: true,
      maxRedirects: 5,
      sslVerification: true,
      saveCookies: true,
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createEmptyTab(): RequestTab {
  const request = createEmptyRequest();
  return {
    id: uid(),
    requestId: null,
    title: "New Request",
    isUnsaved: false,
    request,
    response: null,
    isLoading: false,
    error: null,
  };
}

export function createTabFromRequest(request: ApiRequest): RequestTab {
  return {
    id: uid(),
    requestId: request.id,
    title: request.name,
    isUnsaved: false,
    request,
    response: null,
    isLoading: false,
    error: null,
  };
}

/** Rebuilds a tab from a persisted-session snapshot (see api.tabs.listPersisted).
 * If the snapshot's request still belongs to a collection, treat it as saved;
 * otherwise it's an unsaved scratch tab from last time. */
export function createTabFromPersisted(request: ApiRequest): RequestTab {
  return {
    id: uid(),
    requestId: request.collectionId ? request.id : null,
    title: request.name || request.method,
    isUnsaved: !request.collectionId,
    request,
    response: null,
    isLoading: false,
    error: null,
  };
}