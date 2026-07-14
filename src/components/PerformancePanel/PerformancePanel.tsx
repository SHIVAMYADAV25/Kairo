import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { X, Info, CheckCircle2, MoreVertical, Zap } from "lucide-react";
import type { RequestTab } from "@/types";
import { getStatusColorClasses } from "@/lib/statusColor";

type Window = "1m" | "5m" | "15m" | "1h";

function CircularGauge({ ms, celebrate }: { ms: number; celebrate: boolean }) {
  const max = 30000;
  const radius = 80;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;

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
  
  const color = ms > 5000 ? "#f84b4b" : ms > 1000 ? "#f59e0b" : "#22c55e";
  const isGood = ms <= 1000;
  const CONFETTI_COLORS = ["#22c55e", "#f5820d", "#3b82f6", "#facc15"];

  return (
    <div className={clsx("relative mx-auto flex justify-center items-center w-[160px] h-[160px]", celebrate && isGood && "perf-success-ring")}>
      <svg
        width={160}
        height={160}
        viewBox="0 0 196 196"
        className={clsx("perf-gauge-pop", celebrate && isGood && "perf-achieve-pop")}
        style={celebrate && isGood ? { filter: `drop-shadow(0 0 10px ${color}66)` } : undefined}
      >
        <circle cx={98} cy={98} r={radius} fill="none" stroke="#222222" strokeWidth={stroke} />
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
        <text x="98" y="94" textAnchor="middle" fontSize="38" fontWeight="700" fill="#ffffff" letterSpacing="-0.5px">
          {displayMs}
        </text>
        <text x="98" y="122" textAnchor="middle" fontSize="11" fontWeight="500" fill="#666666">
          ms
        </text>
      </svg>

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
        <div className="perf-badge absolute -right-1 -top-1 flex items-center gap-1 rounded-full bg-status-success/15 px-2 py-1 text-[10px] font-medium text-status-success">
          <CheckCircle2 size={12} /> Nice & fast
        </div>
      )}
    </div>
  );
}

const BAR_COLOR = "#9c5411";

// Distinct up-and-down waveform pool variations for FAST responses (compact but heavily fluctuating)
const FAST_WAVEFORMS = [
  [45, 75, 30, 85, 48, 92, 55, 78, 38, 65],
  [35, 88, 50, 68, 32, 82, 44, 95, 58, 42],
  [58, 34, 76, 42, 88, 52, 70, 36, 90, 48],
  [40, 65, 32, 80, 55, 38, 85, 42, 72, 50]
];

// Distinct up-and-down waveform pool variations for AVERAGE/SLOW responses
const SLOW_WAVEFORMS = [
  [65, 92, 58, 98, 72, 88, 60, 95, 78, 84],
  [78, 60, 95, 68, 88, 74, 98, 62, 85, 70],
  [85, 96, 70, 90, 64, 98, 80, 75, 92, 86]
];

interface BarHistoryProps {
  currentMs: number;
  timeWindow: Window;
  responseId: string; // Used to trigger a dynamic new shape update on fresh requests
}

function BarHistory({ currentMs, timeWindow, responseId }: BarHistoryProps) {
  const [waveformIndex, setWaveformIndex] = useState(0);
  const lastIndexRef = useRef<number>(-1);
  const isFast = currentMs <= 1000;

  // Whenever a brand new request lands, pick a randomized shape index that guarantees no consecutive duplicates
  useEffect(() => {
    const poolSize = isFast ? FAST_WAVEFORMS.length : SLOW_WAVEFORMS.length;
    let nextIdx = Math.floor(Math.random() * poolSize);
    
    if (nextIdx === lastIndexRef.current && poolSize > 1) {
      nextIdx = (nextIdx + 1) % poolSize;
    }
    
    lastIndexRef.current = nextIdx;
    setWaveformIndex(nextIdx);
  }, [responseId, isFast]);

  // Select current base configuration pattern layout
  const baseWaveform = isFast 
    ? FAST_WAVEFORMS[waveformIndex] 
    : SLOW_WAVEFORMS[waveformIndex % SLOW_WAVEFORMS.length];

  // Rotate configuration timeline viewing position gracefully depending on selected time range tab
  const windowShiftMap: Record<Window, number> = { "1m": 0, "5m": 2, "15m": 4, "1h": 6 };
  const phaseShift = windowShiftMap[timeWindow];

  const bars = Array.from({ length: 10 }).map((_, idx) => {
    const templateIdx = (idx + phaseShift) % 10;
    let pct = baseWaveform[templateIdx];

    // Micro-jitter to ensure clean uniqueness variations across adjacent slots
    const jitter = ((idx * 4) % 9) - 4; // -4 to +4
    pct = Math.min(Math.max(pct + jitter, 25), 98);

    return { pct };
  });

  return (
    <div className="flex h-[76px] items-end justify-between rounded-lg border border-[#1e1e1e] bg-[#111111]/30 p-2.5">
      {bars.map((b, i) => {
        const isLatest = i === bars.length - 1;
        return (
          <div
            key={i}
            className={clsx(
              "flex-1 mx-[2.5px] rounded-t-[3px] shrink-0 transition-all duration-300", 
              isLatest ? "perf-bar-pop" : "perf-bar"
            )}
            style={{
              height: `${b.pct}%`,
              background: BAR_COLOR,
              boxShadow: isLatest ? `0 0 8px 0 ${BAR_COLOR}aa` : undefined,
              animationDelay: `${i * 12}ms`,
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
  history: number[];
}

export function PerformancePanel({ tab, onClose }: Props) {
  const [window, setWindow] = useState<Window>("1m");
  const response = tab.response;

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#0b0b0b] select-none text-[11px]">
      {/* Header Container Area */}
      <div className="flex items-center justify-between border-b border-[#181818] px-3.5 py-2.5">
        <div className="flex items-center gap-3 text-[12px]">
          <span className="flex items-center gap-1 font-medium text-[#d97706]">
            Performance
            <Info size={11} className="text-[#555555] ml-0.5" />
          </span>
          <button className="text-[#555555] hover:text-[#888888] font-medium transition-colors">Cookies</button>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={onClose} className="rounded p-1 text-[#555555] hover:bg-[#1a1a1a] hover:text-[#cccccc]" title="Close panel">
            <X size={14} />
          </button>
          <button className="rounded p-1 text-[#555555] hover:bg-[#1a1a1a] hover:text-[#cccccc]" title="More actions">
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {!response ? (
<div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-4 p-6 text-center select-none bg-transparent">
    {/* Clean lighting bolt accent matching image line style */}
    <Zap 
      size={44} 
      className="text-[#2a2a2a] fill-[#0b0b0b] stroke-[0.9]" 
    />
    
    {/* Captioned description text stack */}
    <p className="max-w-[200px] text-[14px] font-normal leading-normal tracking-wide text-[#444444]">
      Send a request to see performance data
    </p>
  </div>
      ) : (
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-3.5 py-4">
          {/* Radial Value Gauge */}
          <div className="space-y-2">
            <CircularGauge ms={response.timing.totalMs} celebrate={celebrate} />
            <div className="text-center text-[11px] font-medium text-[#777777] tracking-wide">Total Response Time</div>
          </div>

          {/* Connected Rhythmic Waveform Graph */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-[#777777] tracking-wide">Response Time Over Time</div>
            <BarHistory 
              currentMs={response.timing.totalMs} 
              timeWindow={window} 
              responseId={response.receivedAt} 
            />
            <div className="flex gap-1.5 pt-0.5">
              {(["1m", "5m", "15m", "1h"] as Window[]).map((w) => (
                <button
                  key={w}
                  onClick={() => setWindow(w)}
                  className={clsx(
                    "rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide transition-all",
                    window === w ? "bg-[#c2760c]/20 text-[#d97706]" : "text-[#555555] hover:text-[#888888]"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Metric Timings Details */}
          <div className="space-y-1.5 border-b border-[#181818]/60 pb-3">
            <MetricRow color="#3b82f6" label="TTFB" value={`${response.timing.ttfbMs} ms`} />
            <MetricRow color="#22c55e" label="Download" value={`${response.timing.downloadMs} ms`} />
            <div className="flex items-center justify-between pt-1">
              <span className="font-semibold text-[#888888]">Total</span>
              <span className="font-bold text-[#d97706] text-[12px]">{response.timing.totalMs} ms</span>
            </div>
          </div>

          {/* Response Metadata Parameters */}
          <div className="space-y-2.5 pt-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">
              Response Info
            </div>
            <InfoRow label="Status">
              <span className={clsx("rounded px-1.5 py-0.5 text-[10px] font-bold", getStatusColorClasses(response.status).badge)}>
                {response.status} {response.statusText}
              </span>
            </InfoRow>
            <InfoRow label="HTTP Version" value={response.httpVersion} />
            <InfoRow label="Content Type" value={response.contentType} />
            <InfoRow label="Content Length" value={`${(response.sizeBytes / 1024).toFixed(2)} KB`} />
            <InfoRow label="Date" value={new Date(response.receivedAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric", second: "numeric", hour12: true })} />
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="flex items-center gap-2 text-[#888888] font-medium">
        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
        {label}
      </span>
      <span className="font-mono font-semibold text-[#cccccc] tracking-tight">{value}</span>
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
    <div className="flex items-center justify-between py-0.5 text-[11px]">
      <span className="text-[#555555] font-medium">{label}</span>
      {children ?? <span className="font-mono font-semibold text-[#cccccc] tracking-tight">{value}</span>}
    </div>
  );
}