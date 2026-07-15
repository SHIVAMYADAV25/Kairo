// import { useEffect, useState } from "react";
// import {
//   Search,
//   Plus,
//   Globe,
//   ChevronRight,
//   ChevronDown,
//   Download,
//   Folder,
//   FolderPlus,
//   FilePlus,
//   Pencil,
//   Trash2,
//   MoreVertical,
//   Loader2,
// } from "lucide-react";
// import { useTabStore } from "@/stores/tabStore";
// import { useCollectionStore } from "@/stores/collectionStore";
// import { createTabFromRequest } from "@/lib/factories";
// import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
// import { PromptModal } from "@/components/common/PromptModal";
// import { api } from "@/lib/api";
// import type { ApiRequest, Collection } from "@/types";

// const METHOD_COLOR: Record<string, string> = {
//   GET: "text-method-get",
//   POST: "text-method-post",
//   PUT: "text-method-put",
//   PATCH: "text-method-patch",
//   DELETE: "text-method-delete",
//   HEAD: "text-method-head",
//   OPTIONS: "text-method-options",
// };

// type PromptState =
//   | { kind: "new-root-collection" }
//   | { kind: "new-subcollection"; parentId: string }
//   | { kind: "rename-collection"; collection: Collection }
//   | { kind: "rename-request"; request: ApiRequest }
//   | null;

// export function CollectionsPanel() {
//   console.log("COLLECTIONS PANEL v2 LOADED");
//   const [query, setQuery] = useState("");
//   const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
//   const [prompt, setPrompt] = useState<PromptState>(null);

//   const {
//     collections,
//     expanded,
//     requestsByCollection,
//     loadingCollectionIds,
//     load,
//     loaded,
//     toggleExpand,
//     createCollection,
//     renameCollection,
//     deleteCollection,
//     createRequestIn,
//     deleteRequest,
//     renameRequest,
//     lastError,
//     clearError,
//   } = useCollectionStore();

//   const { tabs, activeTabId, openTab, setActiveTab } = useTabStore();

//   // The request behind the currently active tab — used to highlight the
//   // matching row in the tree below, the same way a selected item is
//   // highlighted in a todo list.
//   const activeRequestId = tabs.find((t) => t.id === activeTabId)?.requestId ?? null;

//   useEffect(() => {
//     if (!loaded) load().catch(console.error);
//   }, [loaded, load]);

//   const openRequest = (request: ApiRequest) => {
//     const existing = tabs.find((t) => t.requestId === request.id);
//     if (existing) {
//       setActiveTab(existing.id);
//     } else {
//       openTab(createTabFromRequest(request));
//     }
//   };

//   const roots = collections
//     .filter((c) => c.parentId === null)
//     .sort((a, b) => a.position - b.position);

//   const matchesQuery = (c: Collection) =>
//     !query || c.name.toLowerCase().includes(query.toLowerCase());

//   const handleImportUrl = async () => {
//     const url = window.prompt("Paste a collection URL (Postman/OpenAPI export link)");
//     if (!url) return;
//     try {
//       await api.import.fromUrl(url);
//       await load();
//     } catch (e) {
//       console.error(e);
//       window.alert("Import failed — check the console for details.");
//     }
//   };

//   const handleImportFile = async () => {
//     try {
//       const { open } = await import("@tauri-apps/plugin-dialog");
//       const selected = await open({ multiple: false, filters: [{ name: "Collection", extensions: ["json"] }] });
//       if (typeof selected === "string") {
//         await api.import.fromFile(selected);
//         await load();
//       }
//     } catch (e) {
//       console.error(e);
//     }
//   };

//   return (
//     <div className="flex h-full flex-col" style={{ fontSize: "var(--font-sidebar)" }}>
//       {lastError && (
//         <div className="flex items-start gap-2 border-b border-status-error/30 bg-status-error/10 p-2 text-[12px] text-status-error">
//           <span className="flex-1 break-words">{lastError}</span>
//           <button onClick={clearError} className="shrink-0 font-semibold hover:opacity-70">
//             ✕
//           </button>
//         </div>
//       )}
//       <div className="flex items-center gap-2 border-b border-border p-3">
//         <div className="relative flex-1">
//           <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search collections"
//             className="w-full rounded-md border border-border bg-bg-elevated py-1.5 pl-7 pr-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
//           />
//         </div>
//         <button
//           onClick={() => setPrompt({ kind: "new-root-collection" })}
//           className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
//           title="New Collection"
//         >
//           <Plus size={16} />
//         </button>
//       </div>

//       <div className="flex-1 overflow-y-auto p-2">
//         {roots.length === 0 ? (
//           <div className="mt-6 text-center text-text-muted">No collections yet</div>
//         ) : (
//           roots
//             .filter(matchesQuery)
//             .map((c) => (
//               <CollectionNode
//                 key={c.id}
//                 collection={c}
//                 depth={0}
//                 collections={collections}
//                 expanded={expanded}
//                 requestsByCollection={requestsByCollection}
//                 loadingCollectionIds={loadingCollectionIds}
//                 activeRequestId={activeRequestId}
//                 toggleExpand={toggleExpand}
//                 openRequest={openRequest}
//                 onContextMenu={setMenu}
//                 onCreateSubcollection={(parentId) => setPrompt({ kind: "new-subcollection", parentId })}
//                 onRename={(collection) => setPrompt({ kind: "rename-collection", collection })}
//                 onDeleteCollection={(id) => {
//                   if (window.confirm("Delete this collection and everything inside it?")) {
//                     deleteCollection(id).catch(console.error);
//                   }
//                 }}
//                 onNewRequest={(collectionId) => {
//                   createRequestIn(collectionId)
//                     .then((req) => openRequest(req))
//                     .catch(console.error);
//                 }}
//                 onDeleteRequest={(collectionId, requestId) => {
//                   if (window.confirm("Delete this request?")) {
//                     deleteRequest(collectionId, requestId).catch(console.error);
//                   }
//                 }}
//                 onRenameRequest={(request) => setPrompt({ kind: "rename-request", request })}
//               />
//             ))
//         )}
//       </div>

//       <div className="space-y-1.5 border-t border-border p-2">
//         <button
//           type="button"
//           onClick={() => setPrompt({ kind: "new-root-collection" })}
//           className="flex w-full items-center border-none gap-2 rounded-md py-2 pl-3 text-accent font-medium text-sm hover:bg-[#3d2413]"
//         >
//           <Plus size={15} /> New Collection
//         </button>

//         <button
//           type="button"
//           onClick={handleImportUrl}
//           className="flex w-full items-center gap-2 rounded-md border border-[#6a3919] bg-[#1d140e] py-2 pl-3 text-accent font-medium text-sm hover:bg-[#28190e]"
//         >
//           <Globe size={15} /> Import from URL
//         </button>

//         <button
//           type="button"
//           onClick={handleImportFile}
//           className="flex w-full items-center gap-2 py-2 pl-3 text-text-secondary hover:text-text-primary text-xs"
//         >
//           <Download size={14} /> Import from file
//         </button>
//       </div>

//       {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}

//       <PromptModal
//         open={prompt?.kind === "new-root-collection"}
//         title="New Collection"
//         label="Collection name"
//         confirmLabel="Create"
//         onCancel={() => setPrompt(null)}
//         onConfirm={(name) => {
//           setPrompt(null);
//           createCollection(name, null).catch(() => {
//             /* lastError is already set inside the store; the banner below shows it. */
//           });
//         }}
//       />
//       <PromptModal
//         open={prompt?.kind === "new-subcollection"}
//         title="New Folder"
//         label="Folder name"
//         confirmLabel="Create"
//         onCancel={() => setPrompt(null)}
//         onConfirm={(name) => {
//           if (prompt?.kind === "new-subcollection") {
//             const parentId = prompt.parentId;
//             setPrompt(null);
//             createCollection(name, parentId).catch(() => {});
//           } else {
//             setPrompt(null);
//           }
//         }}
//       />
//       <PromptModal
//         open={prompt?.kind === "rename-collection"}
//         title="Rename Collection"
//         label="Collection name"
//         confirmLabel="Save"
//         initialValue={prompt?.kind === "rename-collection" ? prompt.collection.name : ""}
//         onCancel={() => setPrompt(null)}
//         onConfirm={(name) => {
//           if (prompt?.kind === "rename-collection") {
//             renameCollection(prompt.collection.id, name).catch(console.error);
//           }
//           setPrompt(null);
//         }}
//       />
//       <PromptModal
//         open={prompt?.kind === "rename-request"}
//         title="Rename Request"
//         label="Request name"
//         confirmLabel="Save"
//         initialValue={prompt?.kind === "rename-request" ? prompt.request.name : ""}
//         onCancel={() => setPrompt(null)}
//         onConfirm={(name) => {
//           if (prompt?.kind === "rename-request") {
//             renameRequest(prompt.request, name).catch(console.error);
//           }
//           setPrompt(null);
//         }}
//       />
//     </div>
//   );
// }

// interface NodeProps {
//   collection: Collection;
//   depth: number;
//   collections: Collection[];
//   expanded: Record<string, boolean>;
//   requestsByCollection: Record<string, ApiRequest[]>;
//   loadingCollectionIds: Record<string, boolean>;
//   activeRequestId: string | null;
//   toggleExpand: (id: string) => void;
//   openRequest: (r: ApiRequest) => void;
//   onContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
//   onCreateSubcollection: (parentId: string) => void;
//   onRename: (collection: Collection) => void;
//   onDeleteCollection: (id: string) => void;
//   onNewRequest: (collectionId: string) => void;
//   onDeleteRequest: (collectionId: string, requestId: string) => void;
//   onRenameRequest: (request: ApiRequest) => void;
// }

// function CollectionNode(props: NodeProps) {
//   const {
//     collection,
//     depth,
//     collections,
//     expanded,
//     requestsByCollection,
//     loadingCollectionIds,
//     activeRequestId,
//     toggleExpand,
//     openRequest,
//     onContextMenu,
//     onCreateSubcollection,
//     onRename,
//     onDeleteCollection,
//     onNewRequest,
//     onDeleteRequest,
//     onRenameRequest,
//   } = props;

//   const isOpen = !!expanded[collection.id];
//   const isLoading = !!loadingCollectionIds[collection.id];
//   const requests = requestsByCollection[collection.id] ?? [];
//   const subCollections = collections
//     .filter((c) => c.parentId === collection.id)
//     .sort((a, b) => a.position - b.position);

//   const openMenu = (e: React.MouseEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     onContextMenu({
//       x: e.clientX,
//       y: e.clientY,
//       items: [
//         { label: "Add Request", icon: <FilePlus size={13} />, onClick: () => onNewRequest(collection.id) },
//         { label: "Add Folder", icon: <FolderPlus size={13} />, onClick: () => onCreateSubcollection(collection.id) },
//         { label: "Rename", icon: <Pencil size={13} />, onClick: () => onRename(collection), separatorBefore: true },
//         {
//           label: "Delete",
//           icon: <Trash2 size={13} />,
//           onClick: () => onDeleteCollection(collection.id),
//           danger: true,
//         },
//       ],
//     });
//   };

//   return (
//     <div className="mb-0.5">
//       <div
//         className="group flex w-full items-center gap-1 rounded-md py-1.5 pr-1 text-left text-text-primary hover:bg-bg-hover"
//         style={{ paddingLeft: 8 + depth * 14 }}
//         onContextMenu={openMenu}
//       >
//         <button onClick={() => toggleExpand(collection.id)} className="flex flex-1 items-center gap-1.5 overflow-hidden">
//           {isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
//           <Folder size={14} className="shrink-0 text-accent/80" />
//           <span className="truncate">{collection.name}</span>
//           {isLoading && <Loader2 size={12} className="shrink-0 animate-spin text-text-muted" />}
//         </button>
//         <button
//           onClick={openMenu}
//           className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-bg-elevated group-hover:opacity-100"
//           title="More actions"
//         >
//           <MoreVertical size={13} />
//         </button>
//       </div>

//       {isOpen && (
//         <div className="border-l border-border" style={{ marginLeft: 14 + depth * 14 }}>
//           {subCollections.map((sc) => (
//             <CollectionNode key={sc.id} {...props} collection={sc} depth={depth + 1} />
//           ))}

//           {requests.map((r) => (
//             <RequestRow
//               key={r.id}
//               request={r}
//               depth={depth}
//               isActive={r.id === activeRequestId}
//               onOpen={() => openRequest(r)}
//               onDelete={() => onDeleteRequest(collection.id, r.id)}
//               onRename={() => onRenameRequest(r)}
//               onContextMenu={onContextMenu}
//             />
//           ))}

//           {!isLoading && requests.length === 0 && subCollections.length === 0 && (
//             <div className="py-1 pl-4 text-[12px] text-text-muted">Empty</div>
//           )}

//           <button
//             onClick={() => onNewRequest(collection.id)}
//             className="flex items-center gap-1.5 py-1 pl-4 text-[12px] text-text-muted hover:text-accent"
//             style={{ paddingLeft: 12 + depth * 0 }}
//           >
//             <FilePlus size={12} /> Add request
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// function RequestRow({
//   request,
//   depth,
//   isActive,
//   onOpen,
//   onDelete,
//   onRename,
//   onContextMenu,
// }: {
//   request: ApiRequest;
//   depth: number;
//   isActive: boolean;
//   onOpen: () => void;
//   onDelete: () => void;
//   onRename: () => void;
//   onContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
// }) {
//   return (
//     <button
//       onClick={onOpen}
//       onContextMenu={(e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         onContextMenu({
//           x: e.clientX,
//           y: e.clientY,
//           items: [
//             { label: "Open", icon: <FilePlus size={13} />, onClick: onOpen },
//             { label: "Rename", icon: <Pencil size={13} />, onClick: onRename },
//             { label: "Delete", icon: <Trash2 size={13} />, onClick: onDelete, danger: true, separatorBefore: true },
//           ],
//         });
//       }}
//       className={`group relative flex w-full items-center gap-2 py-1 pr-2 text-left ${
//         isActive
//           ? "bg-accent/15 text-text-primary before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-r before:bg-accent"
//           : "rounded-md hover:bg-bg-hover"
//       }`}
//       style={{ paddingLeft: 12 + depth * 14 }}
//     >
//       <span className={`w-10 shrink-0 text-[11px] font-semibold ${METHOD_COLOR[request.method] ?? ""}`}>
//         {request.method}
//       </span>
//       <span className={`flex-1 truncate ${isActive ? "text-text-primary font-medium" : "text-text-secondary"}`}>
//         {request.name}
//       </span>
//       <Trash2
//         size={12}
//         className="shrink-0 text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
//         onClick={(e) => {
//           e.stopPropagation();
//           onDelete();
//         }}
//       />
//     </button>
//   );
// }

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Globe,
  ChevronRight,
  ChevronDown,
  Download,
  Folder,
  FolderPlus,
  FilePlus,
  Pencil,
  Trash2,
  MoreVertical,
  Loader2,
  Play,
} from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { useCollectionStore } from "@/stores/collectionStore";
import { createTabFromRequest } from "@/lib/factories";
import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
import { PromptModal } from "@/components/common/PromptModal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { RunnerModal } from "@/features/runner/RunnerModal";
import { api } from "@/lib/api";
import type { ApiRequest, Collection } from "@/types";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

type PromptState =
  | { kind: "new-root-collection" }
  | { kind: "new-subcollection"; parentId: string }
  | { kind: "rename-collection"; collection: Collection }
  | { kind: "rename-request"; request: ApiRequest }
  | { kind: "import-url" }
  | null;

type ConfirmState =
  | { kind: "delete-collection"; id: string }
  | { kind: "delete-request"; collectionId: string; requestId: string }
  | null;

type DragItem =
  | { type: "collection"; id: string }
  | { type: "request"; id: string; sourceCollectionId: string };

export function CollectionsPanel() {
  const [query, setQuery] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);
  const [prompt, setPrompt] = useState<PromptState>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [dragged, setDragged] = useState<DragItem | null>(null);
  const [runnerCollectionId, setRunnerCollectionId] = useState<string | null>(null);

  const {
    collections,
    expanded,
    requestsByCollection,
    loadingCollectionIds,
    load,
    loaded,
    toggleExpand,
    createCollection,
    renameCollection,
    deleteCollection,
    reorderCollectionInto,
    createRequestIn,
    deleteRequest,
    renameRequest,
    moveRequestToCollection,
    lastError,
    clearError,
  } = useCollectionStore();

  const { tabs, activeTabId, openTab, setActiveTab } = useTabStore();

  const activeRequestId = tabs.find((t) => t.id === activeTabId)?.requestId ?? null;

  useEffect(() => {
    if (!loaded) load().catch(console.error);
  }, [loaded, load]);

  const openRequest = (request: ApiRequest) => {
    const existing = tabs.find((t) => t.requestId === request.id);
    if (existing) {
      setActiveTab(existing.id);
    } else {
      openTab(createTabFromRequest(request));
    }
  };

  const roots = collections.filter((c) => c.parentId === null).sort((a, b) => a.position - b.position);

  const matchesQuery = (c: Collection) => !query || c.name.toLowerCase().includes(query.toLowerCase());

  const [importError, setImportError] = useState<string | null>(null);

  const handleImportUrl = () => {
    setImportError(null);
    setPrompt({ kind: "import-url" });
  };

  const handleConfirmImportUrl = async (url: string) => {
    setPrompt(null);
    try {
      await api.import.fromUrl(url);
      await load();
    } catch (e) {
      console.error(e);
      setImportError("Import failed — that URL didn't return a valid Postman/OpenAPI collection.");
    }
  };

  const handleImportFile = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ multiple: false, filters: [{ name: "Collection", extensions: ["json"] }] });
      if (typeof selected === "string") {
        await api.import.fromFile(selected);
        await load();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDropOnCollection = (targetId: string) => {
    if (!dragged) return;
    if (dragged.type === "collection") {
      if (dragged.id !== targetId) reorderCollectionInto(dragged.id, targetId).catch(console.error);
    } else {
      const req = (requestsByCollection[dragged.sourceCollectionId] ?? []).find((r) => r.id === dragged.id);
      if (req) moveRequestToCollection(req, targetId).catch(console.error);
    }
    setDragged(null);
  };

  return (
    <div className="flex h-full flex-col" style={{ fontSize: "var(--font-sidebar)" }}>
      {lastError && (
        <div className="flex items-start gap-2 border-b border-status-error/30 bg-status-error/10 p-2 text-[12px] text-status-error">
          <span className="flex-1 break-words">{lastError}</span>
          <button onClick={clearError} className="shrink-0 font-semibold hover:opacity-70">✕</button>
        </div>
      )}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search collections"
            className="w-full rounded-md border border-border bg-bg-elevated py-1.5 pl-7 pr-2 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>
        <button onClick={() => setPrompt({ kind: "new-root-collection" })} className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover" title="New Collection">
          <Plus size={16} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-2"
        onDragOver={(e) => dragged?.type === "collection" && e.preventDefault()}
        onDrop={(e) => {
          // Dropping a collection on the empty background area moves it to root.
          if (e.target === e.currentTarget && dragged?.type === "collection") {
            reorderCollectionInto(dragged.id, null).catch(console.error);
            setDragged(null);
          }
        }}
      >
        {roots.length === 0 ? (
          <div className="mt-6 text-center text-text-muted">No collections yet</div>
        ) : (
          roots.filter(matchesQuery).map((c) => (
            <CollectionNode
              key={c.id}
              collection={c}
              depth={0}
              collections={collections}
              expanded={expanded}
              requestsByCollection={requestsByCollection}
              loadingCollectionIds={loadingCollectionIds}
              activeRequestId={activeRequestId}
              dragged={dragged}
              toggleExpand={toggleExpand}
              openRequest={openRequest}
              onContextMenu={setMenu}
              onCreateSubcollection={(parentId) => setPrompt({ kind: "new-subcollection", parentId })}
              onRename={(collection) => setPrompt({ kind: "rename-collection", collection })}
              onDeleteCollection={(id) => setConfirmState({ kind: "delete-collection", id })}
              onNewRequest={(collectionId) => {
                createRequestIn(collectionId).then((req) => openRequest(req)).catch(console.error);
              }}
              onDeleteRequest={(collectionId, requestId) => setConfirmState({ kind: "delete-request", collectionId, requestId })}
              onRenameRequest={(request) => setPrompt({ kind: "rename-request", request })}
              onRunCollection={(id) => setRunnerCollectionId(id)}
              onDragStart={setDragged}
              onDropOnCollection={handleDropOnCollection}
            />
          ))
        )}
      </div>

      <div className="space-y-1.5 border-t border-border p-2">
        <button
          type="button"
          onClick={() => setPrompt({ kind: "new-root-collection" })}
          className="flex w-full items-center border-none gap-2 rounded-md py-2 pl-3 text-accent font-medium text-sm hover:bg-[#3d2413]"
        >
          <Plus size={15} /> New Collection
        </button>

        <button
          type="button"
          onClick={handleImportUrl}
          className="flex w-full items-center gap-2 rounded-md border border-[#6a3919] bg-[#1d140e] py-2 pl-3 text-accent font-medium text-sm hover:bg-[#28190e]"
        >
          <Globe size={15} /> Import from URL
        </button>

        <button
          type="button"
          onClick={handleImportFile}
          className="flex w-full items-center gap-2 py-2 pl-3 text-text-secondary hover:text-text-primary text-xs"
        >
          <Download size={14} /> Import from file
        </button>

        {importError && (
          <div className="flex items-start justify-between gap-2 rounded-md border border-status-error/30 bg-status-error/10 px-2.5 py-1.5 text-[11.5px] text-status-error">
            <span className="flex-1 break-words">{importError}</span>
            <button onClick={() => setImportError(null)} className="shrink-0 font-semibold hover:opacity-70">✕</button>
          </div>
        )}
      </div>

      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}

      <PromptModal
        open={prompt?.kind === "new-root-collection"}
        title="New Collection"
        label="Collection name"
        confirmLabel="Create"
        onCancel={() => setPrompt(null)}
        onConfirm={(name) => {
          setPrompt(null);
          createCollection(name, null).catch(() => {});
        }}
      />
      <PromptModal
        open={prompt?.kind === "new-subcollection"}
        title="New Folder"
        label="Folder name"
        confirmLabel="Create"
        onCancel={() => setPrompt(null)}
        onConfirm={(name) => {
          if (prompt?.kind === "new-subcollection") {
            const parentId = prompt.parentId;
            setPrompt(null);
            createCollection(name, parentId).catch(() => {});
          } else {
            setPrompt(null);
          }
        }}
      />
      <PromptModal
        open={prompt?.kind === "rename-collection"}
        title="Rename Collection"
        label="Collection name"
        confirmLabel="Save"
        initialValue={prompt?.kind === "rename-collection" ? prompt.collection.name : ""}
        onCancel={() => setPrompt(null)}
        onConfirm={(name) => {
          if (prompt?.kind === "rename-collection") renameCollection(prompt.collection.id, name).catch(console.error);
          setPrompt(null);
        }}
      />
      <PromptModal
        open={prompt?.kind === "rename-request"}
        title="Rename Request"
        label="Request name"
        confirmLabel="Save"
        initialValue={prompt?.kind === "rename-request" ? prompt.request.name : ""}
        onCancel={() => setPrompt(null)}
        onConfirm={(name) => {
          if (prompt?.kind === "rename-request") renameRequest(prompt.request, name).catch(console.error);
          setPrompt(null);
        }}
      />
      <PromptModal
        open={prompt?.kind === "import-url"}
        title="Import from URL"
        label="Postman / OpenAPI export link"
        confirmLabel="Import"
        onCancel={() => setPrompt(null)}
        onConfirm={handleConfirmImportUrl}
      />

      <ConfirmModal
        open={confirmState?.kind === "delete-collection"}
        title="Delete collection"
        message="This deletes the collection and everything inside it — subfolders and requests included. This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.kind === "delete-collection") deleteCollection(confirmState.id).catch(console.error);
          setConfirmState(null);
        }}
      />
      <ConfirmModal
        open={confirmState?.kind === "delete-request"}
        title="Delete request"
        message="This can't be undone."
        confirmLabel="Delete"
        onCancel={() => setConfirmState(null)}
        onConfirm={() => {
          if (confirmState?.kind === "delete-request") deleteRequest(confirmState.collectionId, confirmState.requestId).catch(console.error);
          setConfirmState(null);
        }}
      />

      <RunnerModal collectionId={runnerCollectionId} onClose={() => setRunnerCollectionId(null)} />
    </div>
  );
}

interface NodeProps {
  collection: Collection;
  depth: number;
  collections: Collection[];
  expanded: Record<string, boolean>;
  requestsByCollection: Record<string, ApiRequest[]>;
  loadingCollectionIds: Record<string, boolean>;
  activeRequestId: string | null;
  dragged: DragItem | null;
  toggleExpand: (id: string) => void;
  openRequest: (r: ApiRequest) => void;
  onContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
  onCreateSubcollection: (parentId: string) => void;
  onRename: (collection: Collection) => void;
  onDeleteCollection: (id: string) => void;
  onNewRequest: (collectionId: string) => void;
  onDeleteRequest: (collectionId: string, requestId: string) => void;
  onRenameRequest: (request: ApiRequest) => void;
  onRunCollection: (collectionId: string) => void;
  onDragStart: (item: DragItem) => void;
  onDropOnCollection: (targetId: string) => void;
}

function CollectionNode(props: NodeProps) {
  const {
    collection, depth, collections, expanded, requestsByCollection, loadingCollectionIds,
    activeRequestId, dragged, toggleExpand, openRequest, onContextMenu, onCreateSubcollection,
    onRename, onDeleteCollection, onNewRequest, onDeleteRequest, onRenameRequest,
    onRunCollection, onDragStart, onDropOnCollection,
  } = props;

  const [isDropTarget, setIsDropTarget] = useState(false);

  const isOpen = !!expanded[collection.id];
  const isLoading = !!loadingCollectionIds[collection.id];
  const requests = requestsByCollection[collection.id] ?? [];
  const subCollections = collections.filter((c) => c.parentId === collection.id).sort((a, b) => a.position - b.position);

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Add Request", icon: <FilePlus size={13} />, onClick: () => onNewRequest(collection.id) },
        { label: "Add Folder", icon: <FolderPlus size={13} />, onClick: () => onCreateSubcollection(collection.id) },
        { label: "Run Collection", icon: <Play size={13} />, onClick: () => onRunCollection(collection.id), separatorBefore: true },
        { label: "Rename", icon: <Pencil size={13} />, onClick: () => onRename(collection), separatorBefore: true },
        { label: "Delete", icon: <Trash2 size={13} />, onClick: () => onDeleteCollection(collection.id), danger: true },
      ],
    });
  };

  return (
    <div className="mb-0.5">
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          onDragStart({ type: "collection", id: collection.id });
        }}
        onDragOver={(e) => {
          if (!dragged) return;
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragEnter={(e) => {
          if (!dragged) return;
          e.stopPropagation();
          setIsDropTarget(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          setIsDropTarget(false);
        }}
        onDrop={(e) => {
          if (!dragged) return;
          e.preventDefault();
          e.stopPropagation();
          setIsDropTarget(false);
          onDropOnCollection(collection.id);
        }}
        className={`group flex w-full items-center gap-1 rounded-md py-1.5 pr-1 text-left text-text-primary hover:bg-bg-hover ${
          isDropTarget ? "bg-accent/15 ring-1 ring-accent" : ""
        }`}
        style={{ paddingLeft: 8 + depth * 14 }}
        onContextMenu={openMenu}
      >
        <button onClick={() => toggleExpand(collection.id)} className="flex flex-1 items-center gap-1.5 overflow-hidden">
          {isOpen ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
          <Folder size={14} className="shrink-0 text-accent/80" />
          <span className="truncate">{collection.name}</span>
          {isLoading && <Loader2 size={12} className="shrink-0 animate-spin text-text-muted" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRunCollection(collection.id);
          }}
          className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-bg-elevated hover:text-accent group-hover:opacity-100"
          title="Run Collection"
        >
          <Play size={13} />
        </button>
        <button onClick={openMenu} className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-bg-elevated group-hover:opacity-100" title="More actions">
          <MoreVertical size={13} />
        </button>
      </div>

      {isOpen && (
        <div className="border-l border-border" style={{ marginLeft: 14 + depth * 14 }}>
          {subCollections.map((sc) => (
            <CollectionNode key={sc.id} {...props} collection={sc} depth={depth + 1} />
          ))}

          {requests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              collectionId={collection.id}
              depth={depth}
              isActive={r.id === activeRequestId}
              onOpen={() => openRequest(r)}
              onDelete={() => onDeleteRequest(collection.id, r.id)}
              onRename={() => onRenameRequest(r)}
              onContextMenu={onContextMenu}
              onDragStart={onDragStart}
            />
          ))}

          {!isLoading && requests.length === 0 && subCollections.length === 0 && (
            <div className="py-1 pl-4 text-[12px] text-text-muted">Empty</div>
          )}

          <button
            onClick={() => onNewRequest(collection.id)}
            className="flex items-center gap-1.5 py-1 pl-4 text-[12px] text-text-muted hover:text-accent"
            style={{ paddingLeft: 12 + depth * 0 }}
          >
            <FilePlus size={12} /> Add request
          </button>
        </div>
      )}
    </div>
  );
}

function RequestRow({
  request, collectionId, depth, isActive, onOpen, onDelete, onRename, onContextMenu, onDragStart,
}: {
  request: ApiRequest;
  collectionId: string;
  depth: number;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
  onContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
  onDragStart: (item: DragItem) => void;
}) {
  return (
    <button
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        onDragStart({ type: "request", id: request.id, sourceCollectionId: collectionId });
      }}
      onClick={onOpen}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu({
          x: e.clientX,
          y: e.clientY,
          items: [
            { label: "Open", icon: <FilePlus size={13} />, onClick: onOpen },
            { label: "Rename", icon: <Pencil size={13} />, onClick: onRename },
            { label: "Delete", icon: <Trash2 size={13} />, onClick: onDelete, danger: true, separatorBefore: true },
          ],
        });
      }}
      className={`group relative flex w-full items-center gap-2 py-1 pr-2 text-left ${
        isActive
          ? "bg-accent/15 text-text-primary before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-r before:bg-accent"
          : "rounded-md hover:bg-bg-hover"
      }`}
      style={{ paddingLeft: 12 + depth * 14 }}
    >
      <span className={`w-10 shrink-0 text-[11px] font-semibold ${METHOD_COLOR[request.method] ?? ""}`}>{request.method}</span>
      <span className={`flex-1 truncate ${isActive ? "text-text-primary font-medium" : "text-text-secondary"}`}>{request.name}</span>
      <Trash2
        size={12}
        className="shrink-0 text-text-muted opacity-0 hover:text-status-error group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      />
    </button>
  );
}