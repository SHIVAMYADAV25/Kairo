import { useState } from "react";
import clsx from "clsx";
import { X, Copy, Search, Send, WifiOff, Clock, ShieldAlert, Link2Off, PlugZap, AlertTriangle, ChevronDown } from "lucide-react";
import type { RequestTab } from "@/types";
import { ResponseBodyTab } from "./ResponseBodyTab";
import { getStatusColorClasses } from "@/lib/statusColor";
import { getFriendlyError } from "@/lib/errorMessages";
import {
  ResponseHeadersTab,
  ResponseCookiesTab,
  ResponseTestsTab,
  ResponseRawTab,
  ResponsePreviewTab,
} from "./OtherTabs";

const ERROR_ICONS = {
  network: WifiOff,
  timeout: Clock,
  ssl: ShieldAlert,
  url: Link2Off,
  refused: PlugZap,
  generic: AlertTriangle,
} as const;

type SubTab = "response" | "headers" | "cookies" | "tests" | "raw" | "preview";

interface Props {
  tab: RequestTab;
  onClose?: () => void;
}

export function ResponseViewer({ tab, onClose }: Props) {
  const [sub, setSub] = useState<SubTab>("response");
  const response = tab.response;

  const closeButton = onClose ? (
    <button
      onClick={onClose}
      className="shrink-0 text-text-muted hover:text-text-primary transition-colors"
    >
      <X size={14} />
    </button>
  ) : null;

  if (tab.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-text-muted bg-[#0b0b0b] text-[12px]">
        <div className="h-5 w-5 animate-spin rounded-full border border-border border-t-accent" />
        Sending request…
      </div>
    );
  }

  if (tab.error) {
    return <ErrorState rawError={tab.error} />;
  }

if (!response) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[#080808] text-neutral-500 font-normal select-none">
      <div className="flex flex-col items-center justify-center gap-4">
        {/* Circled icon container */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-neutral-900 bg-[#0f0f0f]/30">
          <Send size={48} className="text-neutral-800 rotate-360 transform translate-x-[1px] -translate-y-[1px] pr-2 pt-1.5 pl-1.5 stroke-[1]" />
        </div>
        
        {/* Description Text */}
        <span className="text-[14px] font-normal leading-normal tracking-wide text-[#444444]">
          Send a request to see the response
        </span>
      </div>
    </div>
  );
}

  const tabs: { id: SubTab; label: string; badge?: number }[] = [
    { id: "response", label: "Response" },
    { id: "headers", label: "Headers", badge: Object.keys(response.headers).length },
    { id: "cookies", label: "Cookies" },
    { id: "tests", label: "Tests", badge: response.testResults?.length || undefined },
    { id: "raw", label: "Raw" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0b0b0b] text-[12px] font-sans selection:bg-[#ff8c00]/20 overflow-hidden">
      {/* Primary Navigation Tabs */}
      <div className="flex items-center border-b border-[#141414] px-2 h-[34px] shrink-0 bg-[#0b0b0b]">
        <div className="flex items-center h-full gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setSub(t.id)}
              className={clsx(
                "relative flex items-center px-3 h-full text-[12px] transition-colors border-b-2",
                sub === t.id 
                  ? "text-[#ffffff] font-medium border-accent" 
                  : "text-[#7c7c7c] hover:text-[#aaaaaa] border-transparent"
              )}
            >
              {t.label}
              {t.badge !== undefined && (
                <span className="text-[10px] text-[#555555] ml-1 font-normal">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
        {onClose && <div className="ml-auto pr-2">{closeButton}</div>}
      </div>

      {/* Timing Status Bar Metrics */}
      <div className="flex items-center justify-between border-b border-[#141414] bg-[#0b0b0b] px-4 h-[36px] shrink-0 text-[#7c7c7c] text-[11px]">
        <div className="flex items-center gap-3">
          <div className={clsx("flex items-center justify-center rounded px-1.5 py-0.5 text-[11px] font-bold", getStatusColorClasses(response.status).badge)}>
            {response.status} {response.statusText || "OK"}
          </div>
          <span className="text-[#a3a3a3] font-mono">{response.timing.totalMs} ms</span>
          <span className="text-[#a3a3a3] font-mono">{(response.sizeBytes / 1024).toFixed(2)} KB</span>
          <span className="text-[#555555] font-mono">
            {new Date(response.receivedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hour12: true,
            })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[#555555]">
          <button className="hover:text-[#888888] transition-colors"><Copy size={13} /></button>
          <button className="hover:text-[#888888] transition-colors"><Search size={13} /></button>
        </div>
      </div>

      {/* Router View Panel Section (Fills the remaining area precisely) */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {sub === "response" && <ResponseBodyTab response={response} />}
        {sub === "headers" && <ResponseHeadersTab response={response} />}
        {sub === "cookies" && <ResponseCookiesTab response={response} />}
        {sub === "tests" && <ResponseTestsTab response={response} />}
        {sub === "raw" && <ResponseRawTab response={response} />}
        {sub === "preview" && <ResponsePreviewTab response={response} />}
      </div>
    </div>
  );
}

/**
 * Friendly, learner-facing error screen. Explains in plain language what
 * probably went wrong and what to try next, while still keeping the raw
 * technical error available (collapsed) for anyone who wants it.
 */
function ErrorState({ rawError }: { rawError: string }) {
  const [showRaw, setShowRaw] = useState(false);
  const friendly = getFriendlyError(rawError);
  const Icon = ERROR_ICONS[friendly.icon];

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-y-auto bg-[#0b0b0b] px-6 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#3a1f1f] bg-[#1a1010]">
        <Icon size={26} className="text-[#f84b4b]" />
      </div>

      <div className="max-w-[380px] space-y-2">
        <div className="text-[15px] font-semibold text-[#f0f0f0]">{friendly.title}</div>
        <p className="text-[13px] leading-relaxed text-[#a3a3a3]">{friendly.message}</p>
        {friendly.tip && (
          <p className="rounded-md border border-[#2a2a1a] bg-[#1c1a10] px-3 py-2 text-[12px] leading-relaxed text-[#e0b84a]">
            💡 {friendly.tip}
          </p>
        )}
      </div>

      <button
        onClick={() => setShowRaw((v) => !v)}
        className="flex items-center gap-1 text-[11px] text-[#666666] hover:text-[#999999]"
      >
        <ChevronDown size={12} className={clsx("transition-transform", showRaw && "rotate-180")} />
        {showRaw ? "Hide technical details" : "Show technical details"}
      </button>

      {showRaw && (
        <pre className="max-w-[460px] whitespace-pre-wrap break-all rounded-md border border-[#1e1e1e] bg-[#111111] px-3 py-2 text-left font-mono text-[11px] text-[#888888]">
          {rawError}
        </pre>
      )}
    </div>
  );
}