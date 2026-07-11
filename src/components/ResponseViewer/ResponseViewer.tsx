import { useState } from "react";
import clsx from "clsx";
import type { RequestTab } from "@/types";
import { StatusBar } from "./StatusBar";
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
}

export function ResponseViewer({ tab }: Props) {
  const [sub, setSub] = useState<SubTab>("response");
  const response = tab.response;

  if (tab.isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-text-muted">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        Sending request…
      </div>
    );
  }

  if (tab.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
        <div className="text-[13px] font-semibold text-method-delete">Request failed</div>
        <div className="max-w-md text-[13px] text-text-muted">{tab.error}</div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex h-full items-center justify-center text-text-muted">
        Send a request to see the response
      </div>
    );
  }

  const tabs: { id: SubTab; label: string; badge?: number }[] = [
    { id: "response", label: "Response" },
    { id: "headers", label: "Headers", badge: Object.keys(response.headers).length },
    { id: "cookies", label: "Cookies" },
    { id: "tests", label: "Tests", badge: response.testResults.length || undefined },
    { id: "raw", label: "Raw" },
    { id: "preview", label: "Preview" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-border px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={clsx(
              "relative flex items-center gap-1.5 px-3 py-2.5 text-[13px]",
              sub === t.id ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {t.label}
            {t.badge ? (
              <span className="rounded bg-bg-elevated px-1.5 text-[11px] text-text-muted">
                {t.badge}
              </span>
            ) : null}
            {sub === t.id && <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent" />}
          </button>
        ))}
      </div>

      <StatusBar response={response} onSearchToggle={() => setSub("response")} />

      <div className="flex-1 overflow-hidden">
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
