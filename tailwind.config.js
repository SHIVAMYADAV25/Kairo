/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CSS-variable backed so Settings > Appearance can swap themes live
        bg: {
          base: "var(--bg-base)",
          panel: "var(--bg-panel)",
          elevated: "var(--bg-elevated)",
          hover: "var(--bg-hover)",
        },
        border: {
          DEFAULT: "var(--border)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          hover: "var(--accent-hover)",
        },
        method: {
          get: "#22c55e",
          post: "#f59e0b",
          put: "#3b82f6",
          patch: "#a855f7",
          delete: "#ef4444",
          head: "#14b8a6",
          options: "#64748b",
        },
        status: {
          success: "#22c55e",
          redirect: "#3b82f6",
          error: "#ef4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};
