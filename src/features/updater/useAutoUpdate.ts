import { useCallback, useEffect, useRef, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

export type UpdateStatus = "idle" | "available" | "downloading" | "ready" | "error";

export function useAutoUpdate() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  // Cleared automatically a few seconds after a manual check that found nothing new,
  // so a "You're up to date" message can flash in Settings without lingering forever.
  const [justUpToDate, setJustUpToDate] = useState(false);
  const upToDateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runCheck = useCallback(async () => {
    // Don't interrupt an in-progress download/install with a re-check
    if (status === "downloading" || status === "ready") return null;
    setChecking(true);
    setJustUpToDate(false);
    try {
      const u = await check();
      if (u) {
        setUpdate(u);
        setStatus("available");
      } else {
        if (upToDateTimer.current) clearTimeout(upToDateTimer.current);
        setJustUpToDate(true);
        upToDateTimer.current = setTimeout(() => setJustUpToDate(false), 4000);
      }
      return u;
    } catch (e) {
      console.error("Update check failed:", e);
      return null;
    } finally {
      setChecking(false);
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
      if (upToDateTimer.current) clearTimeout(upToDateTimer.current);
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

  return { status, update, progress, error, checking, justUpToDate, install, dismiss, checkNow: runCheck };
}