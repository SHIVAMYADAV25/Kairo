import { useEffect, useRef } from "react";
import clsx from "clsx";

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  separatorBefore?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Keep the menu on-screen even when the click is near the window edge.
  const maxX = typeof window !== "undefined" ? window.innerWidth - 200 : x;
  const maxY = typeof window !== "undefined" ? window.innerHeight - items.length * 34 - 16 : y;
  const left = Math.min(x, Math.max(8, maxX));
  const top = Math.min(y, Math.max(8, maxY));

  return (
    <div
      ref={ref}
      style={{ left, top }}
      className="fixed z-[100] min-w-[180px] overflow-hidden rounded-md border border-border bg-bg-elevated py-1 shadow-2xl"
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.separatorBefore && <div className="my-1 border-t border-border" />}
          <button
            onClick={() => {
              item.onClick();
              onClose();
            }}
            className={clsx(
              "flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] transition-colors",
              item.danger
                ? "text-status-error hover:bg-status-error/10"
                : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
