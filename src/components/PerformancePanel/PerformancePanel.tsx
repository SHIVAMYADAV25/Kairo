import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X, Info, CheckCircle2, MoreVertical } from "lucide-react";
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
  const CONFETTI_COLORS = ["#22c55e", "#f5820d", "#3b82f6", "#facc15"];

  return (
    <div className={clsx("relative mx-auto", celebrate && isGood && "perf-success-ring")}>
      <svg
        width={196}
        height={196}
        viewBox="0 0 196 196"
        className={clsx("perf-gauge-pop", celebrate && isGood && "perf-achieve-pop")}
        style={celebrate && isGood ? { filter: `drop-shadow(0 0 10px ${color}66)` } : undefined}
      >
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
        <text x="98" y="98" textAnchor="middle" fontSize="34" fontWeight="800" fill="var(--text-primary)">
          {displayMs}
        </text>
        <text x="98" y="124" textAnchor="middle" fontSize="13" fill="var(--text-muted)">
          ms
        </text>
      </svg>

      {/* Small "you earned this" confetti burst — only on a genuinely fast response. */}
      {celebrate && isGood && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="perf-confetti-dot"
              style={
                {
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  "--angle": `${i * 36}deg`,
                  animationDelay: `${i * 25}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {celebrate && isGood && (
        <div className="perf-badge absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-status-success/15 px-2 py-1 text-[11px] font-medium text-status-success">
          <CheckCircle2 size={13} /> Nice & fast
        </div>
      )}
    </div>
  );
}

// Dedicated muted/dim orange for the chart — deliberately not `--accent`
// (the bright orange used for buttons/pills elsewhere), to match the
// reference design's chart color exactly.
const BAR_COLOR = "#c2760c";

// A fixed "always looks alive" pattern of relative heights (0–100), used to
// backfill the chart before enough real requests exist yet — so a brand new
// tab still reads as a full varied chart like the reference instead of one
// lonely bar. Real bars always render on the right in their real order and
// are never replaced by fake ones; fake ones just get pushed off the left
// as real requests accumulate.
const FAKE_SEED_HEIGHTS = [34, 55, 28, 64, 42, 80, 50, 70, 58, 90];
const MIN_BARS = FAKE_SEED_HEIGHTS.length;

function BarHistory({ values }: { values: number[] }) {
  // Fixed-width bars that just accumulate left-to-right, one per request —
  // NOT flex-1 columns sharing the row width. flex-1 was the bug: every new
  // bar meant redividing the same row width among more bars, so every bar
  // already on screen visibly shrank each time a new request landed. Here
  // old bars never resize; once there are more than fit, the row scrolls.
  const max = values.length ? Math.max(...values, 500) : 500;
  const fakeCount = Math.max(MIN_BARS - values.length, 0);

  const bars = [
    ...FAKE_SEED_HEIGHTS.slice(0, fakeCount).map((pct) => ({ pct, ms: null as number | null })),
    ...values.map((v) => ({ pct: Math.max((v / max) * 100, 8), ms: v })),
  ];

  return (
    <div className="flex h-24 items-end gap-2 overflow-x-auto rounded-lg border border-border bg-bg-elevated/40 p-3">
      {bars.map((b, i) => {
        const isLatestReal = b.ms !== null && i === bars.length - 1;
        return (
          <div
            key={i}
            title={b.ms !== null ? `${b.ms} ms` : undefined}
            className={clsx("w-4 shrink-0 rounded-t-md", isLatestReal ? "perf-bar-pop" : "perf-bar")}
            style={{
              height: `${b.pct}%`,
              background: BAR_COLOR,
              boxShadow: isLatestReal ? `0 0 8px 0 ${BAR_COLOR}aa` : undefined,
              animationDelay: `${i * 25}ms`,
            }}
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
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-4 text-[14px]">
          <span className="flex items-center gap-1.5 font-semibold text-accent">
            Performance
            <Info size={13} className="text-text-muted" />
          </span>
          <button className="text-text-muted hover:text-text-secondary">Cookies</button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary" title="Close performance panel">
            <X size={16} />
          </button>
          <button className="rounded p-1 text-text-muted hover:bg-bg-hover hover:text-text-primary" title="More options">
            <MoreVertical size={16} />
          </button>
        </div>
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
            <div className="mt-3 text-center text-[13px] text-text-secondary">Total Response Time</div>
          </div>

          <div>
            <div className="mb-2.5 text-[14px] text-text-secondary">Response Time Over Time</div>
            <BarHistory values={history} />
            <div className="mt-2.5 flex gap-1">
              {(["1m", "5m", "15m", "1h"] as Window[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWindow(w)}
                  className={clsx(
                    "rounded-md px-2.5 py-1 text-[12px] font-medium",
                    window === w ? "bg-accent text-black" : "text-text-muted hover:bg-bg-hover"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5 text-[14px]">
            <MetricRow color="#3b82f6" label="TTFB" value={`${response.timing.ttfbMs} ms`} />
            <MetricRow color="#22c55e" label="Download" value={`${response.timing.downloadMs} ms`} />
            <div className="flex items-center justify-between pt-1">
              <span className="font-medium text-text-secondary">Total</span>
              <span className="font-bold text-accent">{response.timing.totalMs} ms</span>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="text-[13px] font-bold uppercase tracking-wide text-text-secondary">
              Response Info
            </div>
            <InfoRow label="Status">
              <span className="rounded bg-status-success/15 px-2 py-0.5 text-[13px] font-semibold text-status-success">
                {response.status} {response.statusText}
              </span>
            </InfoRow>
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
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        {label}
      </span>
      <span className="font-semibold text-text-primary">{value}</span>
    </div>
  );
}

function InfoRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className="text-text-secondary">{label}</span>
      {children ?? <span className="font-semibold text-text-primary">{value}</span>}
    </div>
  );
}