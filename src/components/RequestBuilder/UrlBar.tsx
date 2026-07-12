import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, Save, Send, Copy, Check } from "lucide-react";
import type { HttpMethod, RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";
import { useCollectionStore } from "@/stores/collectionStore";
import { api } from "@/lib/api";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { SaveRequestModal } from "./SaveRequestModal";
import { parseCurl, buildCurl } from "@/lib/curl";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const METHOD_COLOR: Record<HttpMethod, string> = {
  GET: "text-method-get",
  POST: "text-method-post",
  PUT: "text-method-put",
  PATCH: "text-method-patch",
  DELETE: "text-method-delete",
  HEAD: "text-method-head",
  OPTIONS: "text-method-options",
};

interface Props {
  tab: RequestTab;
}

export function UrlBar({ tab }: Props) {
  const [methodOpen, setMethodOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { updateRequest, setLoading, setResponse, setError, markSaved, markUnsaved } = useTabStore();
  const upsertRequestInCache = useCollectionStore((s) => s.upsertRequestInCache);
  const { environments, activeEnvironmentId } = useEnvironmentStore();

  const activeEnvVars = () => {
    const env = environments.find((e) => e.id === activeEnvironmentId);
    const vars: Record<string, string> = {};
    if (env) for (const v of env.variables) if (v.enabled) vars[v.key] = v.value;
    return vars;
  };

  const handleSend = async () => {
    setLoading(tab.id, true);
    setError(tab.id, null);
    try {
      const watchdogMs = tab.request.settings.timeoutMs + 10_000;
      const response = await Promise.race([
        api.http.execute({
          request: tab.request,
          environmentId: activeEnvironmentId,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timed out after ${watchdogMs / 1000}s waiting for a response. Check your network connection or the target URL.`)),
            watchdogMs
          )
        ),
      ]);
      setResponse(tab.id, response);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("Request failed:", err);
      setError(tab.id, message);
      setResponse(tab.id, null);
    } finally {
      setLoading(tab.id, false);
    }
  };

  const handleSaveClick = () => {
    if (tab.requestId && tab.request.collectionId) {
      api.requests.save(tab.request).then(upsertRequestInCache, console.error);
      return;
    }
    setSaveModalOpen(true);
  };

  const handleConfirmSave = async (name: string, collectionId: string) => {
    const requestToSave = { ...tab.request, name, collectionId, id: tab.request.id };
    try {
      const saved = await api.requests.save(requestToSave);
      upsertRequestInCache(saved);
      markSaved(tab.id, saved.id, saved.name, collectionId);
      markUnsaved(tab.id, false);
      setSaveModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Detects a pasted cURL command in the URL bar and, if it parses, replaces
  // the *whole* request (method/url/headers/params/body/auth) instead of
  // just dumping the raw text into the URL field.
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    const parsed = parseCurl(text);
    if (!parsed) return; // not a curl command — let the normal paste happen
    e.preventDefault();
    updateRequest(tab.id, {
      method: parsed.method,
      url: parsed.url,
      headers: parsed.headers,
      params: parsed.params,
      body: parsed.body,
      auth: parsed.auth,
    });
  };

  const handleCopyAsCurl = async () => {
    const curl = buildCurl(tab.request, activeEnvVars());
    await navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2 border-b border-border bg-bg-base p-3">
      <div className="relative">
        <button
          onClick={() => setMethodOpen((o) => !o)}
          className={clsx(
            "flex w-[110px] items-center justify-between rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] font-semibold",
            METHOD_COLOR[tab.request.method]
          )}
        >
          {tab.request.method}
          <ChevronDown size={14} />
        </button>
        {methodOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 w-[110px] overflow-hidden rounded-md border border-border bg-bg-elevated shadow-xl">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => {
                  updateRequest(tab.id, { method: m });
                  setMethodOpen(false);
                }}
                className={clsx(
                  "block w-full px-3 py-2 text-left text-[13px] font-semibold hover:bg-bg-hover",
                  METHOD_COLOR[m]
                )}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        value={tab.request.url}
        onChange={(e) => updateRequest(tab.id, { url: e.target.value })}
        onPaste={handlePaste}
        placeholder="Enter URL or paste cURL..."
        className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted  focus:outline-none"
      />

      <button
        onClick={handleCopyAsCurl}
        title="Copy as cURL"
        className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-hover"
      >
        {copied ? <Check size={14} className="text-status-success" /> : <Copy size={14} />}
        {copied ? "Copied" : "cURL"}
      </button>

      <button
        onClick={handleSaveClick}
        className="flex items-center gap-1.5 rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-secondary hover:bg-bg-hover"
      >
        <Save size={14} /> Save
      </button>

      <button
        onClick={handleSend}
        disabled={tab.isLoading}
        className="flex items-center gap-1.5 rounded-md bg-accent px-4 py-2 text-[13px] font-medium text-black hover:bg-accent-hover disabled:opacity-60"
      >
        <Send size={14} /> {tab.isLoading ? "Sending..." : "Send"}
      </button>

      <SaveRequestModal
        open={saveModalOpen}
        initialName={tab.request.name === "New Request" ? tab.title : tab.request.name}
        onCancel={() => setSaveModalOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
}

