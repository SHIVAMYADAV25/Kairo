import { useEffect, useState } from "react";
import {
  Plus,
  Settings2,
  ChevronRight,
  ChevronDown,
  Pencil,
  CheckCircle2,
  Circle,
  Layers,
  MoreVertical,
  Sliders,
} from "lucide-react";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { EnvironmentsModal } from "./EnvironmentsModal";
import { ContextMenu, type ContextMenuItem } from "@/components/common/ContextMenu";
import type { Environment } from "@/types";

export function EnvironmentsPanel() {
  console.log("ENVIRONMENTS PANEL v2 LOADED");
  const { environments, activeEnvironmentId, load, setActive } = useEnvironmentStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTargetId, setModalTargetId] = useState<string | null>(null);
  const [modalCreating, setModalCreating] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [menu, setMenu] = useState<{ x: number; y: number; items: ContextMenuItem[] } | null>(null);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  const openManage = (envId: string | null = null) => {
    setModalTargetId(envId);
    setModalCreating(false);
    setModalOpen(true);
  };

  const openCreate = () => {
    setModalTargetId(null);
    setModalCreating(true);
    setModalOpen(true);
  };

  const toggleExpand = (envId: string) => {
    setExpanded((prev) => ({ ...prev, [envId]: !prev[envId] }));
  };

  return (
    <div className="flex h-full flex-col select-none" style={{ fontSize: "var(--font-sidebar)" }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <span className="font-medium text-text-primary">Environments</span>
        <div className="flex gap-1">
          <button
            onClick={() => openManage(activeEnvironmentId ?? environments[0]?.id ?? null)}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
            title="Manage environments"
          >
            <Settings2 size={14} />
          </button>
          <button
            onClick={openCreate}
            className="rounded-md p-1.5 text-text-secondary hover:bg-bg-hover"
            title="New environment"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Node Container List */}
      <div className="flex-1 overflow-y-auto p-2">
        {environments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <div className="rounded-full bg-bg-elevated p-3 text-text-muted">
              <Layers size={18} />
            </div>
            <div>
              <div className="text-[13px] font-medium text-text-primary">No environments yet</div>
              <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
                Group variables like base URLs and tokens so you can switch environments instantly.
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12.5px] font-medium text-black hover:bg-accent-hover"
            >
              <Plus size={14} /> Create environment
            </button>
          </div>
        ) : (
          environments.map((env) => (
            <EnvironmentNode
              key={env.id}
              environment={env}
              isActive={activeEnvironmentId === env.id}
              isOpen={!!expanded[env.id]}
              onToggleExpand={() => toggleExpand(env.id)}
              onSetActive={() => setActive(env.id)}
              onManage={() => openManage(env.id)}
              onContextMenu={setMenu}
            />
          ))
        )}
      </div>

      {/* Quick Action Footer Panels */}
      <div className="space-y-1.5 border-t border-border p-2">
        <button
          type="button"
          onClick={openCreate}
          className="flex w-full items-center border-none gap-2 rounded-md py-2 pl-3 text-accent font-medium text-sm hover:bg-bg-hover/40"
        >
          <Plus size={15} /> New Environment
        </button>
      </div>

      {/* Context Action Menu Overlay */}
      {menu && <ContextMenu x={menu.x} y={menu.y} items={menu.items} onClose={() => setMenu(null)} />}

      {/* Global Windows Frame Manager */}
      <EnvironmentsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initialSelectedId={modalTargetId}
        initialCreating={modalCreating}
      />
    </div>
  );
}

interface NodeProps {
  environment: Environment;
  isActive: boolean;
  isOpen: boolean;
  onToggleExpand: () => void;
  onSetActive: () => void;
  onManage: () => void;
  onContextMenu: (menu: { x: number; y: number; items: ContextMenuItem[] } | null) => void;
}

function EnvironmentNode({
  environment,
  isActive,
  isOpen,
  onToggleExpand,
  onSetActive,
  onManage,
  onContextMenu,
}: NodeProps) {
  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: "Set Active", icon: <CheckCircle2 size={13} />, onClick: onSetActive },
        { label: "Configure Variables", icon: <Pencil size={13} />, onClick: onManage },
      ],
    });
  };

  return (
    <div className="mb-0.5">
      <div
        onContextMenu={openMenu}
        className={`group flex w-full items-center gap-1.5 rounded-md py-1.5 pr-1 text-left text-text-primary hover:bg-bg-hover ${
          isActive ? "bg-accent/5" : ""
        }`}
        style={{ paddingLeft: 6 }}
      >
        {/* Toggle Expand Icon */}
        <button onClick={onToggleExpand} className="shrink-0 p-0.5 text-text-muted hover:text-text-secondary">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Set Active Target Button */}
        <button
          onClick={onSetActive}
          className={`shrink-0 transition-colors ${isActive ? "text-accent" : "text-text-muted hover:text-text-secondary"}`}
        >
          {isActive ? <CheckCircle2 size={14} /> : <Circle size={14} />}
        </button>

        {/* Text Area Clickable Trigger */}
        <button
          onClick={onToggleExpand}
          className={`flex-1 truncate text-left ${isActive ? "font-medium text-accent" : "text-text-secondary"}`}
        >
          {environment.name}
        </button>

        {/* Variable Count Counter Badge */}
        <span className="shrink-0 rounded-full bg-bg-elevated px-1.5 py-0.5 text-[10px] text-text-muted group-hover:opacity-0 transition-opacity">
          {environment.variables.length}
        </span>

        {/* More Operations Overflow Trigger */}
        <button
          onClick={openMenu}
          className="shrink-0 rounded p-1 text-text-muted opacity-0 hover:bg-bg-elevated group-hover:opacity-100"
          title="More actions"
        >
          <MoreVertical size={13} />
        </button>
      </div>

      {/* Expanded Subtree Elements */}
      {isOpen && (
        <div className="border-l border-border ml-[14px]">
          {environment.variables.length === 0 && (
            <div className="py-1 pl-4 text-[12px] text-text-muted">Empty</div>
          )}

          {environment.variables.length > 0 && (
            <div className="space-y-0.5 py-0.5">
              {environment.variables.map((variable: any) => (
                <div
                  key={variable.id}
                  onClick={onManage}
                  className={`group flex w-full items-center justify-between gap-4 py-1 pl-4 pr-2 text-[12px] cursor-pointer rounded-md hover:bg-bg-hover/50 ${
                    !variable.enabled ? "opacity-40" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Sliders size={11} className="shrink-0 text-text-muted/60" />
                    <span className="truncate font-mono text-text-secondary">{variable.key}</span>
                  </div>
                  <span className="truncate font-mono text-right text-text-muted max-w-[50%]">
                    {variable.value || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Clean Inline Action Trigger Button */}
          <button
            onClick={onManage}
            className="flex items-center gap-1.5 py-1 pl-4 text-[12px] text-text-muted hover:text-accent w-full text-left"
          >
            <Plus size={12} /> Add variable
          </button>
        </div>
      )}
    </div>
  );
}