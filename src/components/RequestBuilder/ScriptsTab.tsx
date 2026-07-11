import { lazy, Suspense, useState } from "react";
import clsx from "clsx";
import type { RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface Props {
  tab: RequestTab;
}

export function ScriptsTab({ tab }: Props) {
  const { updateRequest } = useTabStore();
  const [section, setSection] = useState<"pre-request" | "tests">("pre-request");
  const scripts = tab.request.scripts;

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-1 border-b border-border p-2">
        {(["pre-request", "tests"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={clsx(
              "rounded-md px-3 py-1.5 text-[13px] capitalize",
              section === s ? "bg-[#F54900] text-[#FDFFFF]" : "text-text-secondary hover:bg-bg-hover"
            )}
          >
            {s.replace("-", " ")}
          </button>
        ))}
      </div>
      <div className="flex-1">
        <Suspense fallback={<div className="p-4 text-text-muted">Loading editor…</div>}>
          <MonacoEditor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={section === "pre-request" ? scripts.preRequest : scripts.tests}
            onChange={(v) =>
              updateRequest(tab.id, {
                scripts:
                  section === "pre-request"
                    ? { ...scripts, preRequest: v ?? "" }
                    : { ...scripts, tests: v ?? "" },
              })
            }
            options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
          />
        </Suspense>
      </div>
      <div className="border-t border-border p-2 text-[11px] text-text-muted">
        {section === "pre-request"
          ? 'e.g. pm.environment.set("token", "abc123") — runs before the request is sent and before {{VAR}} substitution, so the new value is used immediately.'
          : 'e.g. pm.test("Status is 200", () => pm.expect(pm.response.status).to.eql(200)) — runs after the response comes back.'}
      </div>
    </div>
  );
}
