import { CollectionsPanel } from "./CollectionsPanel";
import { HistoryPanel } from "./HistoryPanel";
import { EnvironmentsPanel } from "@/features/environments/EnvironmentsPanel";
import type { SidebarPanel } from "./IconRail";

interface Props {
  panel: SidebarPanel;
}

export function Sidebar({ panel }: Props) {
  switch (panel) {
    case "collections":
      return <CollectionsPanel />;
    case "history":
      return <HistoryPanel />;
    case "environments":
      return <EnvironmentsPanel />;
    case "sockets":
    case "mocks":
    case "tests":
      return (
        <div className="flex h-full items-center justify-center p-6 text-center text-text-muted">
          {panel[0].toUpperCase() + panel.slice(1)} — coming soon
        </div>
      );
    default:
      return null;
  }
}
