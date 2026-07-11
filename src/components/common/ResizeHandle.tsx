import { useCallback, useRef, useState } from "react";
import clsx from "clsx";

interface Props {
  direction: "horizontal" | "vertical"; // horizontal = drag left/right, vertical = drag up/down
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

/**
 * Thin draggable divider. Reports pixel delta to the parent, which owns the
 * actual size in `settingsStore.panelSizes` (debounced-persisted there).
 */
export function ResizeHandle({ direction, onResize, onResizeEnd }: Props) {
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef(0);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      setDragging(true);
      lastPos.current = direction === "horizontal" ? e.clientX : e.clientY;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [direction]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const pos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = pos - lastPos.current;
      lastPos.current = pos;
      onResize(delta);
    },
    [dragging, direction, onResize]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    onResizeEnd?.();
  }, [onResizeEnd]);

  return (
    <div
      className={clsx(
        "resize-handle",
        direction === "vertical" && "horizontal",
        dragging && "dragging"
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    />
  );
}
