import { useState } from "react";
import clsx from "clsx";
import type { RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";
import { UrlBar } from "./UrlBar";
import { KeyValueTable } from "./KeyValueTable";
import { BodyTab } from "./BodyTab";
import { AuthTab } from "./AuthTab";
import { ScriptsTab } from "./ScriptsTab";
import { SettingsTab } from "./SettingsTab";
import { CodeTab } from "./CodeTab";

const HEADER_SUGGESTIONS = ["Content-Type", "Authorization", "Accept", "Cookie", "Origin"];

type SubTab = "params" | "headers" | "body" | "auth" | "scripts" | "code" | "settings";

const TABS: { id: SubTab; label: string }[] = [
  { id: "params", label: "Params" },
  { id: "headers", label: "Headers" },
  { id: "body", label: "Body" },
  { id: "auth", label: "Auth" },
  { id: "scripts", label: "Scripts" },
  { id: "code", label: "Code" },
  { id: "settings", label: "Settings" },
];

interface Props {
  tab: RequestTab;
}

export function RequestBuilder({ tab }: Props) {
  const [sub, setSub] = useState<SubTab>("params");
  const { updateRequest } = useTabStore();
  const hasBody = tab.request.body.type !== "none";

  return (
    <div className="flex h-full flex-col" style={{ fontSize: "var(--font-request)" }}>
      <UrlBar tab={tab} />

      <div className="flex border-b border-border px-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSub(t.id)}
            className={clsx(
              "relative px-3 py-2.5 text-[13px] font-medium transition-colors",
              sub === t.id ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
            )}
          >
            {t.label}
            {t.id === "body" && hasBody && (
              <span className="absolute right-1 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
            )}
            {sub === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#F54900]" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {sub === "params" && (
          <>
            <div className="px-4 pt-4 text-[11px] font-bold uppercase tracking-widest text-[#a3a3a3]">
              Query Params
            </div>
            <KeyValueTable
              rows={tab.request.params}
              onChange={(rows) => updateRequest(tab.id, { params: rows })}
            />
          </>
        )}
        {sub === "headers" && (
          <>
            <KeyValueTable
              rows={tab.request.headers}
              onChange={(rows) => updateRequest(tab.id, { headers: rows })}
              keySuggestions={HEADER_SUGGESTIONS}
            />
          </>
        )}
        {sub === "body" && <BodyTab tab={tab} />}
        {sub === "auth" && <AuthTab tab={tab} />}
        {sub === "scripts" && <ScriptsTab tab={tab} />}
        {sub === "code" && <CodeTab tab={tab} />}
        {sub === "settings" && <SettingsTab tab={tab} />}
      </div>
    </div>
  );
}