import { useMemo, useState, useEffect, useRef } from "react";
import clsx from "clsx";
import { Search, Files, AlertCircle, ChevronDown } from "lucide-react";
import type { ApiResponse } from "@/types";
import { JsonTree } from "./JsonTree";
import { useSettingsStore } from "@/stores/settingsStore";

type ViewMode = "tree" | "raw";
type Lang = "auto" | "json" | "xml" | "html" | "text";

interface Props {
  response: ApiResponse;
}

interface FloatingTooltip {
  path: string;
  x: number;
  y: number;
}

function formatMarkup(source: string): string {
  try {
    let formatted = "";
    let indent = "";
    const reg = /(>)(<)(\/*)/g;
    const xml = source.replace(reg, "$1\r\n$2$3");
    let pad = 0;
    
    xml.split("\r\n").forEach((node) => {
      let indentLevel = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indentLevel = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) pad -= 1;
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indentLevel = 1;
      } else {
        indentLevel = 0;
      }

      indent = Array(pad).fill("  ").join("");
      formatted += indent + node + "\r\n";
      pad += indentLevel;
    });
    return formatted.trim();
  } catch {
    return source;
  }
}

export function ResponseBodyTab({ response }: Props) {
  const defaultJsonFormat = useSettingsStore((s) => s.settings.defaultJsonFormat);
  const wordWrap = useSettingsStore((s) => s.settings.responseWordWrap);

  const [mode, setMode] = useState<ViewMode>("tree");
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState<Lang>("auto");
  const [pretty, setPretty] = useState(defaultJsonFormat !== "compact");
  const [tooltip, setTooltip] = useState<FloatingTooltip | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tooltip) return;
    const timer = setTimeout(() => {
      setTooltip(null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [tooltip]);

  useEffect(() => {
    function clickAway(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", clickAway);
    return () => document.removeEventListener("mousedown", clickAway);
  }, []);

  const handleKeyClick = (pathArray: (string | number)[], event: React.MouseEvent) => {
    let builtPath = "data";
    pathArray.forEach((seg) => {
      if (typeof seg === "number" || /^\d+$/.test(String(seg))) {
        builtPath += `[${seg}]`;
      } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(String(seg))) {
        builtPath += `.${seg}`;
      } else {
        builtPath += `["${String(seg).replace(/"/g, '\\"')}"]`;
      }
    });

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(builtPath);
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const parentContainer = event.currentTarget.closest(".overflow-auto");
    const parentRect = parentContainer?.getBoundingClientRect();

    setTooltip({
      path: builtPath,
      x: rect.left - (parentRect?.left || 0) + 12,
      y: rect.top - (parentRect?.top || 0) - 26 + (parentContainer?.scrollTop || 0),
    });
  };

  const rawDisplay = useMemo(() => {
    if (!pretty) return response.body;
    try {
      if (lang === "json" || lang === "auto") {
        const parsed = JSON.parse(response.body);
        return JSON.stringify(parsed, null, 2);
      }
      if (lang === "xml" || lang === "html") {
        return formatMarkup(response.body);
      }
    } catch {}
    return response.body;
  }, [response.body, lang, pretty]);

  const parsedJson = useMemo(() => {
    if (lang === "xml" || lang === "html" || lang === "text") return null;
    try {
      return JSON.parse(response.body);
    } catch {
      return null;
    }
  }, [response.body, lang]);

  const lineCount = useMemo(() => {
    return rawDisplay.split("\n").length;
  }, [rawDisplay]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--c-0b0b0b)] relative overflow-hidden">
      {/* View Mode Header Options Bar */}
      <div className="flex items-center border-b border-[var(--c-141414)] px-3 h-[34px] shrink-0 bg-[var(--c-0b0b0b)]">
        <div className="flex items-center gap-1.5 bg-[var(--c-0e0e0e)] p-0.5 rounded border border-[var(--c-161616)]">
          <button
            onClick={() => setMode("tree")}
            className={clsx(
              "text-[11px] font-medium px-2.5 py-0.5 rounded transition-all",
              mode === "tree" 
                ? "bg-[var(--c-181818)] text-accent border border-[var(--c-242424)]" 
                : "text-[var(--c-7c7c7c)] hover:text-[var(--c-aaaaaa)] border border-transparent"
            )}
          >
            Tree
          </button>
          <button
            onClick={() => setMode("raw")}
            className={clsx(
              "text-[11px] font-medium px-2.5 py-0.5 rounded transition-all",
              mode === "raw" 
                ? "bg-[var(--c-181818)] text-accent border border-[var(--c-242424)]" 
                : "text-[var(--c-7c7c7c)] hover:text-[var(--c-aaaaaa)] border border-transparent"
            )}
          >
            View Raw
          </button>
        </div>
      </div>

      {/* Main Internal Content Area (Locks scrolling here) */}
      <div className="flex-1 overflow-auto min-h-0 bg-[var(--c-070707)] relative select-text">
        <div className="p-4">
          {mode === "tree" && parsedJson !== null ? (
            <div className="space-y-3">
              <div className="relative w-full">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--c-444444)]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search keys and values..."
                  className="w-full rounded border border-[var(--c-161616)] bg-[var(--c-0f0f0f)] py-1 pl-8 pr-2 font-sans text-[11px] text-[var(--c-cccccc)] placeholder:text-[var(--c-444444)] focus:border-accent/40 focus:outline-none"
                />
              </div>

              <div className="space-y-1 text-[10px] text-[var(--c-7c7c7c)] font-sans tracking-wide select-none">
                <div className="flex items-center gap-2">
                  <Files size={12} className="text-[var(--c-444444)] shrink-0" />
                  <span>Click any key to copy its JS path</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertCircle size={12} className="text-[var(--c-444444)] shrink-0" />
                  <span>
                    Use <code className="text-accent font-mono font-light text-[9.5px]">data</code> to reference the response body in scripts, e.g. <code className="text-[var(--c-a1a1aa)] font-mono font-light text-[9.5px]">data.users[0].name</code>
                  </span>
                </div>
              </div>

              <div className="font-mono text-[11px] pt-1.5 leading-[1.6] text-[var(--c-dedede)] relative">
                <JsonTree
                  data={parsedJson}
                  searchQuery={search}
                  onKeyClick={handleKeyClick}
                />
              </div>
            </div>
          ) : (
            <pre
              className={clsx(
                "font-mono text-[11px] leading-[1.6]",
                parsedJson === null && lang !== "text" ? "text-[var(--c-cccccc)]" : "text-[#22c55e]",
                wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
              )}
            >
              {rawDisplay}
            </pre>
          )}
        </div>

        {tooltip && (
          <div
            style={{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }}
            className="absolute z-50 pointer-events-none bg-[var(--c-111111)] border border-[var(--c-222222)] text-[#4ade80] px-2 py-0.5 rounded font-mono text-[11px] shadow-lg flex items-center gap-1 opacity-100 transition-opacity duration-150"
          >
            {tooltip.path}
          </div>
        )}
      </div>

      {/* FIXED BOTTOM UTILITY STATUS DOCK BAR */}
      <div className="w-full flex items-center justify-between border-t border-[var(--c-141414)] bg-[var(--c-0b0b0b)] px-4 h-[28px] shrink-0 text-[11px] text-[var(--c-555555)] font-sans font-medium select-none z-10">
        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 bg-transparent text-[var(--c-666666)] hover:text-[var(--c-aaaaaa)] font-sans text-[11px] font-medium transition-colors focus:outline-none"
          >
            <span className="capitalize">{lang === "auto" ? "Auto" : lang.toUpperCase()}</span>
            <ChevronDown size={11} className={clsx("transition-transform duration-150 text-[var(--c-555555)]", dropdownOpen && "rotate-180")} />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 bottom-full mb-1 w-24 rounded border border-[var(--c-161616)] bg-[var(--c-0b0b0b)] py-1 shadow-2xl z-50">
              {(["auto", "json", "xml", "html", "text"] as Lang[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setLang(option);
                    setDropdownOpen(false);
                  }}
                  className={clsx(
                    "w-full px-3 py-1 text-left font-sans text-[11px] transition-colors focus:outline-none",
                    lang === option
                      ? "bg-[var(--c-181818)] text-accent font-medium"
                      : "text-[var(--c-7c7c7c)] hover:bg-[var(--c-111111)] hover:text-[var(--c-aaaaaa)]"
                  )}
                >
                  {option === "auto" ? "Auto" : option.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="font-mono text-[var(--c-444444)] text-[10px]">
            Lines 1-{lineCount} of {lineCount}
          </span>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-[var(--c-555555)]">Prettify</span>
            <button
              type="button"
              onClick={() => setPretty((p) => !p)}
              className={clsx(
                "relative inline-flex h-3.5 w-6 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none",
                pretty ? "bg-accent" : "bg-[var(--c-222222)]"
              )}
            >
              <span
                className={clsx(
                  "pointer-events-none inline-block h-2.5 w-2.5 transform rounded-full bg-white transition duration-200 ease-in-out mt-0.5",
                  pretty ? "translate-x-3" : "translate-x-0.5"
                )}
              />
            </button>
          </label>
          <span className="text-[var(--c-444444)] font-mono text-[10px]">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}