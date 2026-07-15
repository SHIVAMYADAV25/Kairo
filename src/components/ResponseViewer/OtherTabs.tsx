import clsx from "clsx";
import { Check, X } from "lucide-react";
import type { ApiResponse } from "@/types";
import { useSettingsStore } from "@/stores/settingsStore";
import { useMemo } from "react";

export function ResponseHeadersTab({ response }: { response: ApiResponse }) {
  return (
    <div className="flex h-full flex-col bg-[var(--c-0b0b0b)]">
      {/* Scrollable headers viewport area */}
      <div className="flex-1 overflow-auto custom-scrollbar min-h-0 bg-[var(--c-090909)] p-4">
        <div className="space-y-3 font-mono text-[11px] select-text">
          {Object.entries(response.headers).map(([key, value]) => (
            <div key={key} className="flex items-start gap-4 py-0.5 leading-[1.6]">
              <div className="w-[180px] shrink-0 text-[#d97706] font-semibold break-all">
                {key}
              </div>
              <div className="flex-1 text-[var(--c-cccccc)] break-all whitespace-pre-wrap">
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Status Utility Footer Line Block */}
      <div className="flex items-center justify-between border-t border-[var(--c-141414)] bg-[var(--c-0b0b0b)] px-4 h-[28px] shrink-0 text-[11px] text-[var(--c-555555)] font-sans font-medium select-none">
        <div>
          <span className="text-[var(--c-666666)] uppercase font-bold text-[9px] tracking-wider">Auto</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[var(--c-444444)] text-[10px]">
            Lines 1-{Object.keys(response.headers).length} of {Object.keys(response.headers).length}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[var(--c-555555)]">Prettify</span>
            <div className="relative inline-flex h-3.5 w-6 shrink-0 bg-[#d97706] rounded-full">
              <span className="inline-block h-2.5 w-2.5 transform rounded-full bg-white translate-x-3 mt-0.5" />
            </div>
          </div>
          <span className="text-[var(--c-444444)] font-mono text-[10px]">Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}

export function ResponseCookiesTab({ response }: { response: ApiResponse }) {
  if (response.cookies.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--c-090909)] text-[var(--c-555555)] font-sans text-[11px]">
        No cookies set by this response
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[var(--c-0b0b0b)]">
      <div className="flex-1 overflow-auto custom-scrollbar min-h-0 bg-[var(--c-090909)]">
        <table className="w-full text-left font-sans text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[var(--c-141414)] bg-[var(--c-0b0b0b)]/50 text-[10px] uppercase font-semibold text-[var(--c-555555)] sticky top-0 backdrop-blur-sm">
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Value</th>
              <th className="px-4 py-2">Domain</th>
              <th className="px-4 py-2">Path</th>
              <th className="px-4 py-2">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-141414)]/40 text-[var(--c-cccccc)]">
            {response.cookies.map((c, i) => (
              <tr key={i} className="hover:bg-[var(--c-111111)]/40 transition-colors">
                <td className="px-4 py-2 font-mono text-[#d97706] font-medium break-all">{c.name}</td>
                <td className="px-4 py-2 font-mono text-[var(--c-cccccc)] break-all">{c.value}</td>
                <td className="px-4 py-2 text-[var(--c-888888)]">{c.domain}</td>
                <td className="px-4 py-2 text-[var(--c-888888)]">{c.path}</td>
                <td className="px-4 py-2 text-[var(--c-666666)]">{c.expires ?? "Session"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--c-141414)] bg-[var(--c-0b0b0b)] px-4 h-[28px] shrink-0 text-[11px] text-[var(--c-555555)] font-sans font-medium select-none">
        <span className="font-mono text-[var(--c-444444)] text-[10px]">Cookies: {response.cookies.length}</span>
      </div>
    </div>
  );
}

export function ResponseTestsTab({ response }: { response: ApiResponse }) {
  if (!response.testResults || response.testResults.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--c-090909)] text-[var(--c-555555)] font-sans text-[11px]">
        No tests ran for this request
      </div>
    );
  }
  const passed = response.testResults.filter((t) => t.passed).length;
  return (
    <div className="flex h-full flex-col bg-[var(--c-0b0b0b)]">
      <div className="flex-1 overflow-auto custom-scrollbar min-h-0 bg-[var(--c-090909)] p-4 space-y-3 font-sans text-[11px]">
        <div className="text-[var(--c-888888)] font-medium">
          {passed} / {response.testResults.length} metrics passed
        </div>
        <div className="space-y-2">
          {response.testResults.map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1 px-2 rounded bg-[var(--c-111111)]/40 border border-[var(--c-1a1a1a)]/40">
              {t.passed ? (
                <Check size={13} className="text-[#22c55e] shrink-0" />
              ) : (
                <X size={13} className="text-[#f84b4b] shrink-0" />
              )}
              <span className={t.passed ? "text-[var(--c-cccccc)]" : "text-[#f84b4b] font-medium"}>{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ResponseRawTab({ response }: { response: ApiResponse }) {
  const wordWrap = useSettingsStore((s) => s.settings.responseWordWrap);
  const rawHttp = `HTTP/1.1 ${response.status} ${response.statusText}
${Object.entries(response.headers)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

${response.body}`;

  const lineCount = useMemo(() => rawHttp.split("\n").length, [rawHttp]);

  return (
    <div className="flex h-full flex-col bg-[var(--c-0b0b0b)]">
      <div className="flex-1 overflow-auto custom-scrollbar min-h-0 bg-[var(--c-090909)] p-4">
        <pre
          className={clsx(
            "font-mono text-[11px] text-[#22c55e] leading-[1.6] select-text",
            wordWrap ? "whitespace-pre-wrap" : "whitespace-pre"
          )}
        >
          {rawHttp}
        </pre>
      </div>

      <div className="flex items-center justify-between border-t border-[var(--c-141414)] bg-[var(--c-0b0b0b)] px-4 h-[28px] shrink-0 text-[11px] text-[var(--c-555555)] font-sans font-medium select-none">
        <span className="text-[var(--c-666666)] font-bold text-[9px] tracking-wider uppercase">Raw HTTP</span>
        <span className="font-mono text-[var(--c-444444)] text-[10px]">Lines 1-{lineCount} of {lineCount}</span>
      </div>
    </div>
  );
}

export function ResponsePreviewTab({ response }: { response: ApiResponse }) {
  const ct = response.contentType?.toLowerCase() || "";
  
  return (
    <div className="flex h-full flex-col bg-[var(--c-0b0b0b)]">
      <div className="flex-1 bg-[var(--c-090909)] min-h-0 overflow-hidden">
        {(() => {
          if (ct.includes("html")) {
            return <iframe title="preview" className="h-full w-full bg-white invert grayscale" srcDoc={response.body} sandbox="" />;
          }
          if (ct.includes("image")) {
            return (
              <div className="flex h-full items-center justify-center p-4">
                <img className="max-h-full object-contain rounded border border-[var(--c-1a1a1a)]" src={`data:${ct};base64,${btoa(response.body)}`} alt="response preview" />
              </div>
            );
          }
          if (ct.includes("json")) {
            let prettyJson = response.body;
            try {
              prettyJson = JSON.stringify(JSON.parse(response.body), null, 2);
            } catch {}
            return (
              <div className="h-full overflow-auto custom-scrollbar p-4">
                <pre className="font-mono text-[11px] text-[var(--c-cccccc)] leading-[1.6]">{prettyJson}</pre>
              </div>
            );
          }
          return (
            <div className="flex h-full items-center justify-center text-[var(--c-555555)] font-sans text-[11px]">
              No preview available for this content type ({ct})
            </div>
          );
        })()}
      </div>
    </div>
  );
}