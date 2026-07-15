import { lazy, Suspense } from "react";
import clsx from "clsx";
import { X, FileCode } from "lucide-react";
import type { BodyType, RequestBody, RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";
import { KeyValueTable } from "./KeyValueTable";
import { FormDataTable } from "./FormDataTable";

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

  // Reusable theme definition logic for Monaco components
  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme("custom-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "var(--c-141414)",
        "editor.lineHighlightBackground": "var(--c-141414)",
      },
    });
  };

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
                : "bg-[var(--c-1a1a1a)] text-[var(--c-a3a3a3)] border-none hover:bg-[var(--c-262626)] hover:text-text-primary"
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
          <div className="w-full h-[260px] rounded-lg border border-neutral-800/40 bg-[var(--c-141414)] overflow-hidden p-2.5 transition-all">
            <Suspense fallback={<div className="p-4 text-neutral-500 text-[13px]">Loading editor…</div>}>
              <MonacoEditor
                height="100%"
                language="json"
                theme="custom-dark"
                value={body.json ?? "{\n  \n}"}
                onChange={(v) => setBody({ json: v ?? "" })}
                beforeMount={handleEditorWillMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbersMinChars: 3,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderLineHighlight: "none",
                  scrollbar: {
                    vertical: "hidden",
                    horizontal: "hidden",
                  },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  matchBrackets: "always",
                }}
              />
            </Suspense>
          </div>
        )}

        {body.type === "raw" && (
          <div className="w-full h-[260px] rounded-lg border border-neutral-800/40 bg-[var(--c-141414)] overflow-hidden p-2.5 transition-all">
            <Suspense fallback={<div className="p-4 text-neutral-500 text-[13px]">Loading editor…</div>}>
              <MonacoEditor
                height="100%"
                language={body.raw?.language ?? "text"}
                theme="custom-dark"
                value={body.raw?.content ?? ""}
                onChange={(v) =>
                  setBody({ raw: { content: v ?? "", language: body.raw?.language ?? "text" } })
                }
                beforeMount={handleEditorWillMount}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbersMinChars: 3,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  renderLineHighlight: "none",
                  scrollbar: {
                    vertical: "hidden",
                    horizontal: "hidden",
                  },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                }}
              />
            </Suspense>
          </div>
        )}

        {body.type === "url-encoded" && (
          <KeyValueTable
            rows={body.urlEncoded ?? []}
            onChange={(rows) => setBody({ urlEncoded: rows })}
          />
        )}

        {body.type === "form-data" && (
          <FormDataTable
            rows={body.formData ?? []}
            onChange={(rows) => setBody({ formData: rows })}
          />
        )}

        {body.type === "binary" && (
          <div className="flex h-full min-h-[260px] items-center justify-center p-4 bg-transparent select-none">
            {!body.binaryFilePath ? (
              <label className="flex flex-col items-center justify-center text-center cursor-pointer group">
                <div className="mb-4 text-neutral-500 transition-colors group-hover:text-neutral-400">
                  <svg
                    className="w-10 h-10 stroke-[1.25]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>

                <p className="mb-4 text-[13px] tracking-wide text-neutral-500 font-normal">
                  Select a binary file to upload
                </p>

                <span className="rounded bg-[#F54900] px-4 py-1.5 text-[12px] font-semibold text-[#FDFFFF] shadow-sm tracking-wide hover:bg-[#e04300] transition-colors">
                  Select a file
                </span>

                <input
                  type="file"
                  onChange={(e) => setBody({ binaryFilePath: e.target.files?.[0]?.name ?? "" })}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex w-full max-w-md items-center justify-between rounded border border-neutral-800 bg-[var(--c-141414)] px-4 py-3 shadow-md">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F54900]/10 text-[#F54900]">
                    <FileCode size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-[13px] font-medium text-neutral-200">
                      {body.binaryFilePath}
                    </span>
                    <span className="text-[11px] text-neutral-500 tracking-wide mt-0.5">
                      Ready to transport
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBody({ binaryFilePath: "" })}
                  className="ml-4 flex h-6 w-6 items-center justify-center rounded text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-red-400"
                  title="Clear selected file"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}