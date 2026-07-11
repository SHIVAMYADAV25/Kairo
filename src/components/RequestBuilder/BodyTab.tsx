import { lazy, Suspense } from "react";
import clsx from "clsx";
import { Upload, X, FileCode } from "lucide-react";
import type { BodyType, RequestBody, RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";
import { KeyValueTable } from "./KeyValueTable";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

const BODY_TYPES: { id: BodyType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "json", label: "JSON" },
  { id: "form-data", label: "Form Data" },
  { id: "url-encoded", label: "URL Encoded" },
  { id: "raw", label: "Raw" },
  { id: "binary", label: "Binary" },
];

interface Props {
  tab: RequestTab;
}

export function BodyTab({ tab }: Props) {
  const { updateRequest } = useTabStore();
  const body = tab.request.body;

  const setBody = (patch: Partial<RequestBody>) =>
    updateRequest(tab.id, { body: { ...body, ...patch } });

  return (
    <div className="flex h-full flex-col">
      {/* Pill buttons styled precisely matching image layout */}
      <div className="flex flex-wrap gap-2 p-3 bg-bg-base">
        {BODY_TYPES.map((bt) => (
          <button
            key={bt.id}
            onClick={() => setBody({ type: bt.id })}
            className={clsx(
              "rounded-md px-3.5 py-1 text-[11px] font-normal tracking-wide transition-all",
              body.type === bt.id
                ? "bg-[#F54900] text-[#FDFFFF] font-semibold"
                : "bg-[#1a1a1a] text-[#a3a3a3] border-none  hover:bg-[#262626] hover:text-text-primary"
            )}
          >
            {bt.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden px-3 rounded-xl">
        {body.type === "none" && (
          <div className="flex h-full items-center justify-center text-text-muted text-[13px]">
            This request has no body
          </div>
        )}

        {body.type === "json" && (
          <Suspense fallback={<div className="p-4 text-text-muted">Loading editor…</div>}>
            <MonacoEditor
              height="100%"
              language="json"
              theme="vs-dark"
              value={body.json ?? '{\n  \n}'}
              onChange={(v) => setBody({ json: v ?? "" })}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </Suspense>
        )}

        {body.type === "raw" && (
          <Suspense fallback={<div className="p-4 text-text-muted">Loading editor…</div>}>
            <MonacoEditor
              height="100%"
              language={body.raw?.language ?? "text"}
              theme="vs-dark"
              value={body.raw?.content ?? ""}
              onChange={(v) =>
                setBody({ raw: { content: v ?? "", language: body.raw?.language ?? "text" } })
              }
              options={{ minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
            />
          </Suspense>
        )}

        {body.type === "url-encoded" && (
          <KeyValueTable
            rows={body.urlEncoded ?? []}
            onChange={(rows) => setBody({ urlEncoded: rows })}
          />
        )}

        {body.type === "form-data" && (
          <div className="p-4 text-text-muted text-[13px]">
            Form Data editor (text/file fields) — same table UX as Params/Headers, plus a per-row type toggle.
          </div>
        )}

        {body.type === "binary" && (
          <div className="flex h-full items-center justify-center p-8 bg-bg-base">
            {!body.binaryFilePath ? (
              <label className="group flex h-full w-full max-w-2xl cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border/60 bg-[#0d0d0d] px-6 py-10 text-center transition-all hover:border-accent/40 hover:bg-[#121212]">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="mb-4 h-8 w-8 text-text-muted/40 transition-colors group-hover:text-accent/60" />
                  <p className="mb-4 text-[13px] text-text-secondary">
                    Select a binary file to upload
                  </p>
                  <span className="rounded bg-[#f97316] px-4 py-2 text-[12px] font-medium text-black shadow transition-all hover:bg-[#ea580c]">
                    Select a file
                  </span>
                </div>
                <input
                  type="file"
                  onChange={(e) => setBody({ binaryFilePath: e.target.files?.[0]?.name ?? "" })}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex w-full max-w-md items-center justify-between rounded-lg border border-border/30 bg-[#111111] p-4 shadow-sm">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <FileCode size={18} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-[13px] font-medium text-text-primary">
                      {body.binaryFilePath}
                    </span>
                    <span className="text-[11px] text-text-muted">Ready to transport</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBody({ binaryFilePath: "" })}
                  className="ml-4 flex h-7 w-7 items-center justify-center rounded-md text-text-muted/60 transition-colors hover:bg-bg-hover hover:text-status-error"
                  title="Clear selected file"
                >
                  <X size={15} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}