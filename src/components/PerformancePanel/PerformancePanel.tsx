import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X, Info, CheckCircle2 } from "lucide-react";
import type { RequestTab } from "@/types";

type Window = "1m" | "5m" | "15m" | "1h";

// Simple in-memory ring buffer per tab session. Persisted history (last 10/20/50
// requests) is read from `api.history.list()` once wired to the backend.
function CircularGauge({ ms, celebrate }: { ms: number; celebrate: boolean }) {
  const max = 30000;
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;

  // Animate the number counting up and the ring filling in together, rather
  // than snapping straight to the final value — a slower fill reads as more
  // deliberate/"earned" than an instant jump, which is the small bit of
  // psychology fix #4 asked for.
  const [displayMs, setDisplayMs] = useState(0);
  useEffect(() => {
    setDisplayMs(0);
    const start = performance.now();
    const duration = 500;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayMs(Math.round(ms * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ms]);

  const pct = Math.min(displayMs / max, 1);
  const offset = circumference * (1 - pct);
  const color = ms > 5000 ? "#ef4444" : ms > 1000 ? "#f59e0b" : "#22c55e";
  const isGood = ms <= 1000;

  return (
    <div className={clsx("relative mx-auto", celebrate && isGood && "perf-success-ring")}>
      <svg width={196} height={196} viewBox="0 0 196 196" className="perf-gauge-pop">
        <circle cx={98} cy={98} r={radius} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={98}
          cy={98}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 98 98)"
          style={{ transition: "stroke-dashoffset 0.15s linear, stroke 0.3s ease" }}
        />
        <text x="98" y="94" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--text-primary)">
          {displayMs}
        </text>
        <text x="98" y="118" textAnchor="middle" fontSize="13" fill="var(--text-muted)">
          ms
        </text>
      </svg>
      {celebrate && isGood && (
        <div className="perf-badge absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-status-success/15 px-2 py-1 text-[11px] font-medium text-status-success">
          <CheckCircle2 size={13} /> Nice & fast
        </div>
      )}
    </div>
  );
}

function BarHistory({ values }: { values: number[] }) {
  if (values.length === 0) {
    return (
      <div className="flex h-14 items-end justify-center gap-1 text-[11px] text-text-muted">
        No requests yet in this tab
      </div>
    );
  }
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-14 items-end gap-1">
      {values.map((v, i) => {
        const isLatest = i === values.length - 1;
        const color = v > 5000 ? "bg-status-error/70" : v > 1000 ? "bg-status-redirect/70" : "bg-accent/70";
        return (
          <div
            key={i}
            title={`${v} ms`}
            className={clsx("perf-bar flex-1 rounded-sm transition-[height] duration-300 ease-out", color, isLatest && "ring-1 ring-accent")}
            style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
          />
        );
      })}
    </div>
  );
}

interface Props {
  tab: RequestTab;
  onClose: () => void;
  history: number[]; // recent totalMs values, most recent last
}

export function PerformancePanel({ tab, onClose, history }: Props) {
  const [window, setWindow] = useState<Window>("1m");
  const response = tab.response;

  // Only play the "just landed" celebration animation once per response,
  // not every time this panel re-renders (e.g. when switching the window
  // filter) — otherwise the pulse would replay on unrelated interactions.
  const [celebrate, setCelebrate] = useState(false);
  const lastReceivedAt = useRef<string | null>(null);
  useEffect(() => {
    if (response && response.receivedAt !== lastReceivedAt.current) {
      lastReceivedAt.current = response.receivedAt;
      setCelebrate(true);
      const t = setTimeout(() => setCelebrate(false), 1000);
      return () => clearTimeout(t);
    }
  }, [response]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="font-medium text-accent">Performance</span>
          <button className="text-text-muted hover:text-text-secondary">Cookies</button>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary" title="Close performance panel">
          <X size={16} />
        </button>
      </div>

      {!response ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-text-muted">
          <Info size={20} />
          Send a request to see performance data
        </div>
      ) : (
        <div className="flex-1 space-y-6 p-4">
          <div>
            <CircularGauge ms={response.timing.totalMs} celebrate={celebrate} />
            <div className="mt-2 text-center text-[12px] text-text-muted">Total Response Time</div>
          </div>

          <div>
            <div className="mb-2 text-[13px] text-text-secondary">Response Time Over Time</div>
            <BarHistory values={history} />
            <div className="mt-2 flex gap-1">
              {(["1m", "5m", "15m", "1h"] as Window[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWindow(w)}
                  className={clsx(
                    "rounded px-2 py-0.5 text-[11px]",
                    window === w ? "bg-accent text-black" : "text-text-muted hover:bg-bg-hover"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-[13px]">
            <MetricRow color="#3b82f6" label="TTFB" value={`${response.timing.ttfbMs} ms`} />
            <MetricRow color="#22c55e" label="Download" value={`${response.timing.downloadMs} ms`} />
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="text-text-secondary">Total</span>
              <span className="font-semibold text-accent">{response.timing.totalMs} ms</span>
            </div>
          </div>

          <div>
            <div className="mb-2 text-[12px] uppercase text-text-muted">Response Info</div>
            <InfoRow label="Status" value={String(response.status)} valueClass="text-status-success" />
            <InfoRow label="HTTP Version" value={response.httpVersion} />
            <InfoRow label="Content Type" value={response.contentType} />
            <InfoRow label="Content Length" value={`${(response.sizeBytes / 1024).toFixed(2)} KB`} />
            <InfoRow label="Date" value={new Date(response.receivedAt).toLocaleString()} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-text-secondary">
        <span className="h-2 w-2 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="text-text-primary">{value}</span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 text-[13px]">
      <span className="text-text-secondary">{label}</span>
      <span className={valueClass ?? "text-text-primary"}>{value}</span>
    </div>
  );
}
