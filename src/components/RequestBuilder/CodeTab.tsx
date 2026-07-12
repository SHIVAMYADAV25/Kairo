import { lazy, Suspense, useMemo, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { RequestTab } from "@/types";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { CODEGEN_LANGUAGES, generateSnippet, type CodegenLanguage } from "@/lib/codegen";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface Props {
  tab: RequestTab;
}

export function CodeTab({ tab }: Props) {
  const [lang, setLang] = useState<CodegenLanguage>("curl");
  const [copied, setCopied] = useState(false);
  const { environments, activeEnvironmentId } = useEnvironmentStore();
  const activeEnv = environments.find((e) => e.id === activeEnvironmentId) ?? null;

  const snippet = useMemo(() => generateSnippet(lang, tab.request, activeEnv), [lang, tab.request, activeEnv]);
  const monacoLang = CODEGEN_LANGUAGES.find((l) => l.id === lang)?.monacoLang ?? "text";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as CodegenLanguage)}
          className="rounded-md border border-border bg-bg-elevated px-2 py-1.5 text-[13px] text-text-primary focus:border-accent focus:outline-none"
        >
          {CODEGEN_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>{l.label}</option>
          ))}
        </select>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-3 py-1.5 text-[12px] text-text-secondary hover:bg-bg-hover"
        >
          {copied ? <Check size={13} className="text-status-success" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="flex-1">
        <Suspense fallback={<div className="p-4 text-text-muted">Loading editor…</div>}>
          <MonacoEditor
            height="100%"
            language={monacoLang}
            theme="vs-dark"
            value={snippet}
            options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, automaticLayout: true }}
          />
        </Suspense>
      </div>
    </div>
  );
}