import { create } from "zustand";
import type { ApiRequest, Collection } from "@/types";
import { api } from "@/lib/api";
import { createEmptyRequest } from "@/lib/factories";

interface CollectionState {
  collections: Collection[];
  // Requests are loaded lazily per-collection (that's the shape the backend
  // command takes — `list_requests` wants one collectionId, not "give me
  // everything"), so we cache them here keyed by collection id.
  requestsByCollection: Record<string, ApiRequest[]>;
  loadingCollectionIds: Record<string, boolean>;
  expanded: Record<string, boolean>;
  loaded: boolean;

  load: () => Promise<void>;
  toggleExpand: (id: string) => void;
  ensureRequestsLoaded: (collectionId: string) => Promise<void>;

  createCollection: (name: string, parentId: string | null) => Promise<Collection>;
  renameCollection: (id: string, name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  createRequestIn: (collectionId: string) => Promise<ApiRequest>;
  saveRequest: (request: ApiRequest) => Promise<void>;
  upsertRequestInCache: (request: ApiRequest) => void;
  renameRequest: (request: ApiRequest, name: string) => Promise<void>;
  deleteRequest: (collectionId: string, requestId: string) => Promise<void>;

  childrenOf: (parentId: string | null) => Collection[];
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  requestsByCollection: {},
  loadingCollectionIds: {},
  expanded: {},
  loaded: false,

  load: async () => {
    const collections = await api.collections.list();
    set({ collections, loaded: true });
  },

  toggleExpand: (id) => {
    const willExpand = !get().expanded[id];
    set((s) => ({ expanded: { ...s.expanded, [id]: willExpand } }));
    if (willExpand) get().ensureRequestsLoaded(id).catch(console.error);
  },

  ensureRequestsLoaded: async (collectionId) => {
    if (get().requestsByCollection[collectionId] || get().loadingCollectionIds[collectionId]) return;
    set((s) => ({ loadingCollectionIds: { ...s.loadingCollectionIds, [collectionId]: true } }));
    try {
      const requests = await api.requests.listByCollection(collectionId);
      set((s) => ({ requestsByCollection: { ...s.requestsByCollection, [collectionId]: requests } }));
    } finally {
      set((s) => ({ loadingCollectionIds: { ...s.loadingCollectionIds, [collectionId]: false } }));
    }
  },

  createCollection: async (name, parentId) => {
    const collection = await api.collections.create(name, parentId);
    set((s) => ({ collections: [...s.collections, collection] }));
    if (parentId) {
      set((s) => ({ expanded: { ...s.expanded, [parentId]: true } }));
    }
    return collection;
  },

  renameCollection: async (id, name) => {
    await api.collections.rename(id, name);
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? { ...c, name } : c)),
    }));
  },

  deleteCollection: async (id) => {
    // Backend cascades to child collections/requests; mirror that locally by
    // dropping every descendant id from the tree + request cache.
    const all = get().collections;
    const toRemove = new Set<string>([id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of all) {
        if (c.parentId && toRemove.has(c.parentId) && !toRemove.has(c.id)) {
          toRemove.add(c.id);
          grew = true;
        }
      }
    }
    await api.collections.delete(id);
    set((s) => {
      const requestsByCollection = { ...s.requestsByCollection };
      for (const rid of toRemove) delete requestsByCollection[rid];
      return {
        collections: s.collections.filter((c) => !toRemove.has(c.id)),
        requestsByCollection,
      };
    });
  },

  createRequestIn: async (collectionId) => {
    const request = createEmptyRequest(collectionId);
    const saved = await api.requests.save(request);
    set((s) => ({
      requestsByCollection: {
        ...s.requestsByCollection,
        [collectionId]: [...(s.requestsByCollection[collectionId] ?? []), saved],
      },
      expanded: { ...s.expanded, [collectionId]: true },
    }));
    return saved;
  },

  saveRequest: async (request) => {
    const saved = await api.requests.save(request);
    get().upsertRequestInCache(saved);
  },

  upsertRequestInCache: (saved) => {
    if (!saved.collectionId) return;
    set((s) => {
      const list = s.requestsByCollection[saved.collectionId!] ?? [];
      const exists = list.some((r) => r.id === saved.id);
      const nextList = exists ? list.map((r) => (r.id === saved.id ? saved : r)) : [...list, saved];
      return {
        requestsByCollection: { ...s.requestsByCollection, [saved.collectionId!]: nextList },
      };
    });
  },

  renameRequest: async (request, name) => {
    const saved = await api.requests.save({ ...request, name });
    get().upsertRequestInCache(saved);
  },

  deleteRequest: async (collectionId, requestId) => {
    await api.requests.delete(requestId);
    set((s) => ({
      requestsByCollection: {
        ...s.requestsByCollection,
        [collectionId]: (s.requestsByCollection[collectionId] ?? []).filter((r) => r.id !== requestId),
      },
    }));
  },

  childrenOf: (parentId) => get().collections.filter((c) => c.parentId === parentId),
}));
