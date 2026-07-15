/**
 * Maps an HTTP status code to a consistent set of colors used across the
 * Response viewer and Performance panel, so a 404 always looks different
 * from a 200 or a 500 — instead of everything being green.
 */
export interface StatusColorClasses {
  /** Tailwind arbitrary-value classes for a small status badge/pill */
  badge: string;
  /** Just the text color, for places that only need the number colored */
  text: string;
  /** A solid dot color, for status indicators */
  dot: string;
  /** Human label for the status "family" (used in tooltips/empty states) */
  category: "informational" | "success" | "redirect" | "clientError" | "serverError" | "unknown";
}

export function getStatusColorClasses(status: number | null | undefined): StatusColorClasses {
  if (!status || status <= 0) {
    return {
      badge: "bg-[var(--c-1a1a1a)] border border-[var(--c-2a2a2a)] text-[var(--c-9c9c9c)]",
      text: "text-[var(--c-9c9c9c)]",
      dot: "bg-[var(--c-6b6b6b)]",
      category: "unknown",
    };
  }

  if (status >= 100 && status < 200) {
    return {
      badge: "bg-[var(--c-0f1f2e)] border border-[var(--c-1c3a52)] text-[#38bdf8]",
      text: "text-[#38bdf8]",
      dot: "bg-[#38bdf8]",
      category: "informational",
    };
  }

  if (status >= 200 && status < 300) {
    return {
      badge: "bg-[var(--c-112519)] border border-[var(--c-1b3d29)] text-[#22c55e]",
      text: "text-[#22c55e]",
      dot: "bg-[#22c55e]",
      category: "success",
    };
  }

  if (status >= 300 && status < 400) {
    return {
      badge: "bg-[var(--c-12202e)] border border-[var(--c-1d3a52)] text-[#60a5fa]",
      text: "text-[#60a5fa]",
      dot: "bg-[#60a5fa]",
      category: "redirect",
    };
  }

  if (status >= 400 && status < 500) {
    return {
      badge: "bg-[var(--c-2e2410)] border border-[var(--c-4a3a12)] text-[#f59e0b]",
      text: "text-[#f59e0b]",
      dot: "bg-[#f59e0b]",
      category: "clientError",
    };
  }

  // 5xx and anything else unexpected
  return {
    badge: "bg-[var(--c-2e1414)] border border-[var(--c-4a1c1c)] text-[#f84b4b]",
    text: "text-[#f84b4b]",
    dot: "bg-[#f84b4b]",
    category: "serverError",
  };
}