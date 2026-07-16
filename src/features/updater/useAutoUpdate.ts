import { useCallback, useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

export type UpdateStatus = "idle" | "available" | "downloading" | "ready" | "error";

export function useAutoUpdate() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const runCheck = useCallback(async () => {
    // Don't interrupt an in-progress download/install with a re-check
    if (status === "downloading" || status === "ready") return;
    try {
      const u = await check();
      if (u) {
        setUpdate(u);
        setStatus("available");
      }
    } catch (e) {
      console.error("Update check failed:", e);
    }
  }, [status]);

  useEffect(() => {
    runCheck(); // on launch

    const interval = setInterval(runCheck, CHECK_INTERVAL_MS);
    const onFocus = () => runCheck();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [runCheck]);

  const install = useCallback(async () => {
    if (!update) return;
    setStatus("downloading");
    let downloaded = 0;
    let total = 0;
    try {
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength ?? 0;
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (total) setProgress(Math.round((downloaded / total) * 100));
            break;
          case "Finished":
            setStatus("ready");
            break;
        }
      });
    } catch (e) {
      setError(String(e));
      setStatus("error");
    }
  }, [update]);

  const dismiss = useCallback(() => setStatus("idle"), []);

  return { status, update, progress, error, install, dismiss, checkNow: runCheck };
}