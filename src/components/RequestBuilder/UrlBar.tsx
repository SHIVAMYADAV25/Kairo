import { useState } from "react";
import clsx from "clsx";
import { ChevronDown, Save, Send } from "lucide-react";
import type { HttpMethod, RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";
import { api } from "@/lib/api";
import { useEnvironmentStore } from "@/stores/environmentStore";

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
  const { updateRequest, setLoading, setResponse, setError } = useTabStore();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);

  const handleSend = async () => {
    setLoading(tab.id, true);
    setError(tab.id, null);
    try {
      // Client-side watchdog: the Rust side has its own request.settings.timeoutMs,
      // but if something upstream of that (DNS resolution, TLS handshake stall,
      // firewall silently dropping packets, etc.) hangs the invoke() promise
      // itself, this guarantees the UI never gets stuck on "Sending..." forever.
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

  const handleSave = async () => {
    await api.requests.save(tab.request).catch(console.error);
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
        placeholder="Enter URL or paste cURL..."
        className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted  focus:outline-none"
      />

      <button
        onClick={handleSave}
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
    </div>
  );
}
