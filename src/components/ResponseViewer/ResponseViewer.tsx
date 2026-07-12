import { useState } from "react";
import clsx from "clsx";
import { X, Copy, Search, Send } from "lucide-react";
import type { RequestTab } from "@/types";
import { ResponseBodyTab } from "./ResponseBodyTab";
import {
  ResponseHeadersTab,
  ResponseCookiesTab,
  ResponseTestsTab,
  ResponseRawTab,
  ResponsePreviewTab,
} from "./OtherTabs";

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
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1 px-4 text-center bg-[#0b0b0b] text-[12px]">
        <div className="font-semibold text-method-delete">Request failed</div>
        <div className="text-text-muted font-mono text-[11px]">{tab.error}</div>
      </div>
    );
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
    <div className="flex h-full flex-col bg-[#0b0b0b] text-[12px] font-sans selection:bg-[#ff8c00]/20 overflow-hidden">
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
          <div className="flex items-center justify-center rounded bg-[#112519] border border-[#1b3d29] px-1.5 py-0.5 text-[11px] font-bold text-[#22c55e]">
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