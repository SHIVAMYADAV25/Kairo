import { useState } from "react";
import clsx from "clsx";
import { X, Info } from "lucide-react";
import type { RequestTab } from "@/types";

type Window = "1m" | "5m" | "15m" | "1h";

// Simple in-memory ring buffer per tab session. Persisted history (last 10/20/50
// requests) is read from `api.history.list()` once wired to the backend.
function CircularGauge({ ms, max = 30000 }: { ms: number; max?: number }) {
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(ms / max, 1);
  const offset = circumference * (1 - pct);

  const color = ms > 5000 ? "#ef4444" : ms > 1000 ? "#f59e0b" : "#22c55e";

  return (
    <svg width={196} height={196} viewBox="0 0 196 196" className="mx-auto">
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
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
      <text x="98" y="94" textAnchor="middle" fontSize="30" fontWeight="700" fill="var(--text-primary)">
        {ms}
      </text>
      <text x="98" y="118" textAnchor="middle" fontSize="13" fill="var(--text-muted)">
        ms
      </text>
    </svg>
  );
}

function BarHistory({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-14 items-end gap-1">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-accent/70"
          style={{ height: `${Math.max((v / max) * 100, 6)}%` }}
        />
      ))}
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

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-4 text-[13px]">
          <span className="font-medium text-accent">Performance</span>
          <button className="text-text-muted hover:text-text-secondary">Cookies</button>
        </div>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
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
            <CircularGauge ms={response.timing.totalMs} />
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
