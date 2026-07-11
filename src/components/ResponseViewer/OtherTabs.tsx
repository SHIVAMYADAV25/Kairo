import { Copy, Check, X } from "lucide-react";
import type { ApiResponse } from "@/types";

export function ResponseHeadersTab({ response }: { response: ApiResponse }) {
  return (
    <div className="overflow-auto p-2" style={{ fontSize: "var(--font-response)" }}>
      {Object.entries(response.headers).map(([key, value]) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 border-b border-border px-2 py-2"
        >
          <div className="min-w-0">
            <div className="font-mono text-accent">{key}</div>
            <div className="truncate font-mono text-text-secondary">{value}</div>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(value)}
            className="shrink-0 text-text-muted hover:text-text-primary"
          >
            <Copy size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function ResponseCookiesTab({ response }: { response: ApiResponse }) {
  if (response.cookies.length === 0) {
    return <div className="p-6 text-center text-text-muted">No cookies set by this response</div>;
  }
  return (
    <div className="overflow-auto" style={{ fontSize: "var(--font-response)" }}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border text-[11px] uppercase text-text-muted">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Value</th>
            <th className="px-3 py-2">Domain</th>
            <th className="px-3 py-2">Path</th>
            <th className="px-3 py-2">Expires</th>
          </tr>
        </thead>
        <tbody>
          {response.cookies.map((c, i) => (
            <tr key={i} className="border-b border-border">
              <td className="px-3 py-2 font-mono text-text-primary">{c.name}</td>
              <td className="px-3 py-2 font-mono text-text-secondary">{c.value}</td>
              <td className="px-3 py-2 text-text-secondary">{c.domain}</td>
              <td className="px-3 py-2 text-text-secondary">{c.path}</td>
              <td className="px-3 py-2 text-text-secondary">{c.expires ?? "Session"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ResponseTestsTab({ response }: { response: ApiResponse }) {
  if (response.testResults.length === 0) {
    return <div className="p-6 text-center text-text-muted">No tests ran for this request</div>;
  }
  const passed = response.testResults.filter((t) => t.passed).length;
  return (
    <div className="p-3" style={{ fontSize: "var(--font-response)" }}>
      <div className="mb-3 text-text-secondary">
        {passed}/{response.testResults.length} passed
      </div>
      {response.testResults.map((t, i) => (
        <div key={i} className="flex items-center gap-2 py-1">
          {t.passed ? (
            <Check size={15} className="text-status-success" />
          ) : (
            <X size={15} className="text-status-error" />
          )}
          <span className={t.passed ? "text-text-primary" : "text-status-error"}>{t.name}</span>
        </div>
      ))}
    </div>
  );
}

export function ResponseRawTab({ response }: { response: ApiResponse }) {
  const rawHttp = `HTTP/1.1 ${response.status} ${response.statusText}
${Object.entries(response.headers)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

${response.body}`;
  return (
    <pre
      className="h-full overflow-auto whitespace-pre-wrap p-3 font-mono text-text-secondary"
      style={{ fontSize: "var(--font-response)" }}
    >
      {rawHttp}
    </pre>
  );
}

export function ResponsePreviewTab({ response }: { response: ApiResponse }) {
  const ct = response.contentType.toLowerCase();
  if (ct.includes("html")) {
    return (
      <iframe
        title="preview"
        className="h-full w-full bg-white"
        srcDoc={response.body}
        sandbox=""
      />
    );
  }
  if (ct.includes("image")) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <img src={`data:${ct};base64,${btoa(response.body)}`} alt="response preview" />
      </div>
    );
  }
  if (ct.includes("json")) {
    return (
      <pre className="h-full overflow-auto p-3 font-mono text-text-secondary">
        {(() => {
          try {
            return JSON.stringify(JSON.parse(response.body), null, 2);
          } catch {
            return response.body;
          }
        })()}
      </pre>
    );
  }
  return <div className="p-6 text-center text-text-muted">No preview available for this content type</div>;
}
