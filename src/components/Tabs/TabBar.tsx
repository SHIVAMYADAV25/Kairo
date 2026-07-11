import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { useTabStore } from "@/stores/tabStore";
import { createEmptyTab } from "@/lib/factories";

const METHOD_COLOR: Record<string, string> = {
  GET: "text-method-get", // Make sure this color resolves nicely like the green in your image
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, openTab } = useTabStore();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
      {tabs.map((tab) => {
        const isActive = activeTabId === tab.id;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "group flex shrink-0 cursor-pointer items-center gap-2.5 px-3.5 py-1 text-[13px] font-medium transition-all duration-150",
              // Pill design matching the image rounded look
              "rounded-full border border-transparent",
              isActive
                ? "bg-bg-panel text-text-primary border-border/40 shadow-sm"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            <span className={clsx("text-[10px] font-bold tracking-wider", METHOD_COLOR[tab.request.method] || "text-green-500")}>
              {tab.request.method}
            </span>
            <span className="max-w-[140px] truncate text-[12.5px]">
              {tab.title || "New Request"}
            </span>
            {tab.isUnsaved && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
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
      
      {/* Plus Button */}
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