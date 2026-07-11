import clsx from "clsx";
import {
  Folder,
  Globe,
  History,
  Radio,
  Lock,
  CheckSquare,
  Settings,
  User,
} from "lucide-react";

export type SidebarPanel =
  | "collections"
  | "environments"
  | "history"
  | "sockets"
  | "mocks"
  | "tests"
  | "settings";

const ITEMS: { id: SidebarPanel; label: string; icon: typeof Folder }[] = [
  { id: "collections", label: "Collections", icon: Folder },
  { id: "environments", label: "Environ.", icon: Globe },
  { id: "history", label: "History", icon: History },
  { id: "sockets", label: "Sockets", icon: Radio },
  { id: "mocks", label: "Mocks", icon: Lock },
  { id: "tests", label: "Tests", icon: CheckSquare },
];

interface Props {
  active: SidebarPanel;
  onChange: (panel: SidebarPanel) => void;
  onOpenSettings: () => void;
}

export function IconRail({ active, onChange, onOpenSettings }: Props) {
  return (
    <div className="flex w-[70px] shrink-0 flex-col items-center border-r border-border bg-bg-base py-2">
      {/* Top list */}
      <div className="flex flex-1 flex-col gap-1 items-center w-full">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={clsx(
              "flex w-[60px] flex-col items-center gap-1 rounded-md py-2 text-[10px] transition-colors",
              active === id
                ? "text-accent bg-[#2b190d]"
                : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
            )}
          >
            <Icon size={16} strokeWidth={3} />
            {label}
          </button>
        ))}
      </div>

      {/* Bottom list */}
      <div className="flex flex-col gap-1 items-center w-full">
        <button
          type="button"
          onClick={onOpenSettings}
          className={clsx(
            "flex w-[60px] flex-col items-center gap-1 rounded-md py-2 text-[10px] transition-colors",
            active === "settings"
              ? "text-accent bg-[#2b190d]"
              : "text-text-muted hover:bg-bg-hover hover:text-text-secondary"
          )}
        >
          <Settings size={18} strokeWidth={3} />
          Settings
        </button>
        <button 
          type="button" 
          className="flex w-[52px] flex-col items-center gap-1 rounded-xl py-2 text-text-muted hover:bg-bg-hover hover:text-text-secondary"
        >
          <User size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}