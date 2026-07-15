import type { CSSProperties, ReactNode } from "react";

interface Props {
  /** CSS var name to read the scale from, e.g. "--zoom-sidebar" */
  cssVar: "--zoom-sidebar" | "--zoom-request" | "--zoom-response";
  children: ReactNode;
  className?: string;
}

/**
 * Wraps a panel's content so it can be zoomed in/out independently of the
 * other panels. Uses the CSS `zoom` property (rather than transform: scale)
 * because zoom actually reflows the box — so zooming in makes content
 * genuinely bigger and lets the outer container's scrollbar reach it,
 * instead of just visually scaling in place and clipping.
 *
 * The outer element (rendered by the parent, e.g. App.tsx) is expected to
 * have a fixed width/height and `overflow: auto` so zoomed-in content that
 * no longer fits can be scrolled to.
 */
export function ZoomWrapper({ cssVar, children, className }: Props) {
  const style: CSSProperties = {
    zoom: `var(${cssVar})`,
    height: "100%",
    minHeight: "100%",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}