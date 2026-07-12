// import { useEffect, useRef, useState } from "react";
// import clsx from "clsx";
// import { Plus, X } from "lucide-react";
// import { useTabStore } from "@/stores/tabStore";
// import { createEmptyTab } from "@/lib/factories";

// const METHOD_COLOR: Record<string, string> = {
//   GET: "text-method-get", // Make sure this color resolves nicely like the green in your image
//   POST: "text-method-post",
//   PUT: "text-method-put",
//   PATCH: "text-method-patch",
//   DELETE: "text-method-delete",
//   HEAD: "text-method-head",
//   OPTIONS: "text-method-options",
// };

// export function TabBar() {
//   const { tabs, activeTabId, setActiveTab, closeTab, openTab, renameTab } = useTabStore();
//   const [editingTabId, setEditingTabId] = useState<string | null>(null);
//   const [draftName, setDraftName] = useState("");
//   const inputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (editingTabId) {
//       inputRef.current?.focus();
//       inputRef.current?.select();
//     }
//   }, [editingTabId]);

//   const startEditing = (tabId: string, currentTitle: string) => {
//     setEditingTabId(tabId);
//     setDraftName(currentTitle);
//   };

//   const commitEditing = () => {
//     if (editingTabId) {
//       const trimmed = draftName.trim();
//       if (trimmed) renameTab(editingTabId, trimmed);
//     }
//     setEditingTabId(null);
//   };

//   const cancelEditing = () => setEditingTabId(null);

//   return (
//     <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
//       {tabs.map((tab) => {
//         const isActive = activeTabId === tab.id;
//         const isEditing = editingTabId === tab.id;
//         return (
//           <div
//             key={tab.id}
//             onClick={() => {
//               if (!isEditing) setActiveTab(tab.id);
//             }}
//             onDoubleClick={() => startEditing(tab.id, tab.title)}
//             className={clsx(
//               "group flex shrink-0 cursor-pointer items-center gap-2.5 px-3.5 py-1 text-[13px] font-medium transition-all duration-150",
//               // Pill design matching the image rounded look
//               "rounded-full border border-transparent",
//               isActive
//                 ? "bg-bg-panel text-text-primary border-border/40 shadow-sm"
//                 : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
//             )}
//           >
//             <span className={clsx("text-[10px] font-bold tracking-wider", METHOD_COLOR[tab.request.method] || "text-green-500")}>
//               {tab.request.method}
//             </span>

//             {isEditing ? (
//               <input
//                 ref={inputRef}
//                 value={draftName}
//                 onChange={(e) => setDraftName(e.target.value)}
//                 onClick={(e) => e.stopPropagation()}
//                 onBlur={commitEditing}
//                 onKeyDown={(e) => {
//                   if (e.key === "Enter") {
//                     e.preventDefault();
//                     commitEditing();
//                   } else if (e.key === "Escape") {
//                     e.preventDefault();
//                     cancelEditing();
//                   }
//                 }}
//                 className="w-[120px] max-w-[140px] rounded border border-accent/60 bg-bg-elevated px-1 py-0 text-[12.5px] text-text-primary outline-none"
//               />
//             ) : (
//               <span
//                 className="max-w-[140px] truncate text-[12.5px]"
//                 title="Click to rename"
//                 onClick={(e) => {
//                   // Only the already-active tab enters rename mode on a
//                   // single click, so this doesn't fight with tab switching.
//                   if (isActive) {
//                     e.stopPropagation();
//                     startEditing(tab.id, tab.title);
//                   }
//                 }}
//               >
//                 {tab.title || "New Request"}
//               </span>
//             )}

//             {tab.isUnsaved && !isEditing && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}

//             <button
//               onClick={(e) => {
//                 e.stopPropagation();
//                 closeTab(tab.id);
//               }}
//               className={clsx(
//                 "rounded-full p-0.5 transition-opacity duration-150 hover:bg-bg-base",
//                 isActive ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-70 hover:!opacity-100"
//               )}
//             >
//               <X size={12} />
//             </button>
//           </div>
//         );
//       })}
      
//       {/* Plus Button */}
//       <button
//         onClick={() => openTab(createEmptyTab())}
//         className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors ml-1"
//         title="New tab"
//       >
//         <Plus size={15} />
//       </button>
//     </div>
//   );
// }

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { createEmptyTab } from "@/lib/factories";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, openTab, renameTab } = useTabStore();
  const confirmBeforeClosing = useSettingsStore((s) => s.settings.confirmBeforeClosingUnsavedTabs);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingTabId]);

  const startEditing = (tabId: string, currentTitle: string) => {
    setEditingTabId(tabId);
    setDraftName(currentTitle);
  };

  const commitEditing = () => {
    if (editingTabId) {
      const trimmed = draftName.trim();
      if (trimmed) renameTab(editingTabId, trimmed);
    }
    setEditingTabId(null);
  };

  const cancelEditing = () => setEditingTabId(null);

  const handleClose = (tabId: string, title: string, isUnsaved: boolean) => {
    if (confirmBeforeClosing && isUnsaved) {
      if (!window.confirm(`"${title || "New Request"}" has unsaved changes. Close anyway?`)) return;
    }
    closeTab(tabId);
  };

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        const isEditing = editingTabId === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => {
              if (!isEditing) setActiveTab(tab.id);
            }}
            onDoubleClick={() => startEditing(tab.id, tab.title)}
            className={clsx(
              "group flex shrink-0 cursor-pointer items-center gap-2.5 px-3.5 py-1 text-[13px] font-medium transition-all duration-150",
              "rounded-full border border-transparent",
              isActive
                ? "bg-bg-panel text-text-primary border-border/40 shadow-sm"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <span className={clsx("text-[10px] font-bold tracking-wider", METHOD_COLOR[tab.request.method] || "text-green-500")}>
              {tab.request.method}
            </span>

            {isEditing ? (
              <input
                ref={inputRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={commitEditing}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEditing();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEditing();
                  }
                }}
                className="w-[120px] max-w-[140px] rounded border border-accent/60 bg-bg-elevated px-1 py-0 text-[12.5px] text-text-primary outline-none"
              />
            ) : (
              <span
                className="max-w-[140px] truncate text-[12.5px]"
                title="Click to rename"
                onClick={(e) => {
                  if (isActive) {
                    e.stopPropagation();
                    startEditing(tab.id, tab.title);
                  }
                }}
              >
                {tab.title || "New Request"}
              </span>
            )}

            {tab.isUnsaved && !isEditing && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose(tab.id, tab.title, tab.isUnsaved);
              }}
              className={clsx(
                "rounded-full p-0.5 transition-opacity duration-150 hover:bg-bg-base",
                isActive ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-70 hover:!opacity-100"
              )}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}

      <button
        onClick={() => openTab(createEmptyTab())}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-hover hover:text-text-primary transition-colors ml-1"
        title="New tab"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}