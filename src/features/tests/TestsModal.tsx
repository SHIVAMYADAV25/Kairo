import { useState } from "react";
import clsx from "clsx";
import {
  X, Zap, TrendingUp, Activity, Clock, CheckCircle2, Link2, ChevronDown, ChevronUp,
  Plus, Play, Square, RotateCcw,
} from "lucide-react";
import { useOpenTabsStore } from "@/stores/openTabsStore";
import { useTabStore } from "@/stores/tabStore";
import { useCollectionStore } from "@/stores/collectionStore";
import { useRunnerStore, type RunnerState, type RunnerResult } from "@/stores/runnerStore";
import { useEnvironmentStore } from "@/stores/environmentStore";
import { useLoadTestStore, type LoadTestState } from "@/stores/loadTestStore";
import { api } from "@/lib/api";
import { uid } from "@/lib/factories";
import type { LoadTestConfig, LoadTestShape, LoadTestProgress } from "@/types/loadtest";
import type { ApiResponse } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
}

type TestKind = LoadTestShape | "response" | "chain";

const CARDS: { kind: TestKind; icon: typeof Zap; title: string; subtitle: string; typeLabel: string }[] = [
  { kind: "load", icon: Zap, title: "Quick Load Test", subtitle: "10 VUs for 30 seconds", typeLabel: "Load Test - Constant virtual users for a set duration" },
  { kind: "stress", icon: TrendingUp, title: "Stress Test", subtitle: "Ramp 1→100 VUs over 60s", typeLabel: "Stress Test - Ramp up users to find breaking points" },
  { kind: "spike", icon: Activity, title: "Spike Test", subtitle: "5 base → 50 burst → recovery", typeLabel: "Spike Test - Sudden burst of traffic then recovery" },
  { kind: "soak", icon: Clock, title: "Soak Test", subtitle: "5 VUs for 5 minutes", typeLabel: "Soak Test - Sustained load over extended period" },
  { kind: "response", icon: CheckCircle2, title: "Response Check", subtitle: "Status 200 + timing <500ms", typeLabel: "Response Assertions - Validate response status, timing, body" },
  { kind: "chain", icon: Link2, title: "Chain Test", subtitle: "Sequential from collection", typeLabel: "Chain/Sequence Test - Sequential requests with variable passing" },
];

const SOAK_PRESETS: { label: string; secs: number }[] = [
  { label: "1m", secs: 60 },
  { label: "5m", secs: 300 },
  { label: "10m", secs: 600 },
  { label: "30m", secs: 1800 },
  { label: "1h", secs: 3600 },
  { label: "2h", secs: 7200 },
];

type AssertionField = "status" | "responseTime" | "body" | "header" | "jsonPath";
type AssertionOp = "=" | "!=" | "contains" | "!contains" | "<" | ">" | "regex" | "exists" | "!exists";

interface Assertion {
  id: string;
  enabled: boolean;
  field: AssertionField;
  headerName: string;
  jsonPath: string;
  operator: AssertionOp;
  value: string;
}

const FIELD_LABEL: Record<AssertionField, string> = {
  status: "Status code",
  responseTime: "Response time",
  body: "Body",
  header: "Header",
  jsonPath: "Body JSON path",
};
const OPERATORS: AssertionOp[] = ["=", "!=", "contains", "!contains", "<", ">", "regex", "exists", "!exists"];

interface FlatCollection {
  id: string;
  label: string;
}

function flatten(
  collections: { id: string; name: string; parentId: string | null }[],
  parentId: string | null = null,
  depth = 0
): FlatCollection[] {
  return collections
    .filter((c) => c.parentId === parentId)
    .flatMap((c): FlatCollection[] => [
      { id: c.id, label: `${"— ".repeat(depth)}${c.name}` },
      ...flatten(collections, c.id, depth + 1),
    ]);
}

export function TestsModal({ open, onClose }: Props) {
  const [kind, setKind] = useState<TestKind>("load");
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [virtualUsers, setVirtualUsers] = useState(10);
  const [durationSecs, setDurationSecs] = useState(30);
  const [requestsPerVu, setRequestsPerVu] = useState(0);
  const [startVus, setStartVus] = useState(1);
  const [peakVus, setPeakVus] = useState(100);
  const [rampDurationSecs, setRampDurationSecs] = useState(60);
  const [holdAtPeakSecs, setHoldAtPeakSecs] = useState(10);
  const [baseVus, setBaseVus] = useState(5);
  const [spikeVus, setSpikeVus] = useState(50);
  const [preSpikeSecs, setPreSpikeSecs] = useState(10);
  const [spikeSecs, setSpikeSecs] = useState(5);
  const [postSpikeSecs, setPostSpikeSecs] = useState(15);
  const [soakVus, setSoakVus] = useState(5);
  const [soakDurationSecs, setSoakDurationSecs] = useState(300);
  const [rampUpSecs, setRampUpSecs] = useState(0);
  const [thinkTimeMs, setThinkTimeMs] = useState(0);
  const [timeoutSecs, setTimeoutSecs] = useState(30);
  const [followRedirects, setFollowRedirects] = useState(true);

  const [assertions, setAssertions] = useState<Assertion[]>([
    { id: uid(), enabled: true, field: "status", headerName: "", jsonPath: "", operator: "=", value: "200" },
    { id: uid(), enabled: true, field: "responseTime", headerName: "", jsonPath: "", operator: "<", value: "500" },
  ]);
  const [checkResponse, setCheckResponse] = useState<ApiResponse | null>(null);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkRunning, setCheckRunning] = useState(false);

  const [collectionId, setCollectionId] = useState("");
  const collections = useCollectionStore((s) => s.collections);
  const collectRequestsRecursive = useCollectionStore((s) => s.collectRequestsRecursive);
  const runner: RunnerState = useRunnerStore();
  const activeEnvironmentId = useEnvironmentStore((s) => s.activeEnvironmentId);

  const load: LoadTestState = useLoadTestStore();

  if (!open) return null;

  const flatCollections = flatten(collections);

  const useActiveRequest = () => {
    const { order, activeKey } = useOpenTabsStore.getState();
    const ref = order.find((t) => t.key === activeKey);
    if (ref?.kind !== "http") return;
    const tab = useTabStore.getState().tabs.find((t) => t.id === ref.id);
    if (tab) {
      setMethod(tab.request.method);
      setUrl(tab.request.url);
    }
  };

  const addAssertion = () =>
    setAssertions((a) => [...a, { id: uid(), enabled: true, field: "status", headerName: "", jsonPath: "", operator: "=", value: "" }]);
  const updateAssertion = (id: string, patch: Partial<Assertion>) =>
    setAssertions((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeAssertion = (id: string) => setAssertions((a) => a.filter((x) => x.id !== id));

  const handleRun = async () => {
    setShowResults(true);

    if (kind === "response") {
      setCheckRunning(true);
      setCheckError(null);
      setCheckResponse(null);
      try {
        const response = await api.http.execute({
          request: {
            id: uid(),
            collectionId: null,
            name: "Response Check",
            method: method as any,
            url,
            params: [],
            headers: [],
            body: { type: "none" },
            auth: { type: "none" },
            scripts: { preRequest: "", tests: "" },
            settings: { timeoutMs: timeoutSecs * 1000, followRedirects, maxRedirects: 5, sslVerification: true, saveCookies: false },
            updatedAt: new Date().toISOString(),
          },
          environmentId: activeEnvironmentId,
        });
        setCheckResponse(response);
      } catch (e) {
        setCheckError(e instanceof Error ? e.message : String(e));
      } finally {
        setCheckRunning(false);
      }
      return;
    }

    if (kind === "chain") {
      if (!collectionId) return;
      runner.reset();
      const requests = await collectRequestsRecursive(collectionId);
      runner.run(requests, activeEnvironmentId);
      return;
    }

    const config: LoadTestConfig = {
      testId: uid(),
      shape: kind,
      method,
      url,
      headers: [],
      body: null,
      virtualUsers: kind === "load" ? virtualUsers : undefined,
      durationSecs: kind === "load" ? durationSecs : undefined,
      requestsPerVu: kind === "load" ? requestsPerVu : undefined,
      startVus: kind === "stress" ? startVus : undefined,
      peakVus: kind === "stress" ? peakVus : undefined,
      rampDurationSecs: kind === "stress" ? rampDurationSecs : undefined,
      holdAtPeakSecs: kind === "stress" ? holdAtPeakSecs : undefined,
      baseVus: kind === "spike" ? baseVus : undefined,
      spikeVus: kind === "spike" ? spikeVus : undefined,
      preSpikeSecs: kind === "spike" ? preSpikeSecs : undefined,
      spikeSecs: kind === "spike" ? spikeSecs : undefined,
      postSpikeSecs: kind === "spike" ? postSpikeSecs : undefined,
      rampUpSecs,
      thinkTimeMs,
      timeoutSecs,
      followRedirects,
    };
    if (kind === "soak") {
      config.virtualUsers = soakVus;
      config.durationSecs = soakDurationSecs;
    }

    load.ensureListeners();
    load.run(config).catch(console.error);
  };

  const handleBack = () => {
    setShowResults(false);
    load.reset();
    runner.reset();
    setCheckResponse(null);
    setCheckError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div className="flex max-h-[88vh] w-[900px] max-w-full flex-col overflow-hidden rounded-lg border border-border bg-bg-panel shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-[20px] font-semibold text-text-primary">API Testing</h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {!showResults ? (
            <>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-text-muted">Quick Start</div>
              <div className="mb-5 grid grid-cols-3 gap-3">
                {CARDS.map((c) => (
                  <button
                    key={c.kind}
                    onClick={() => setKind(c.kind)}
                    className={clsx(
                      "rounded-lg border p-3.5 text-left transition-colors",
                      kind === c.kind ? "border-accent bg-accent/10" : "border-border hover:bg-bg-hover"
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <c.icon size={16} className={kind === c.kind ? "text-accent" : "text-text-secondary"} />
                      <span className="text-[13px] font-semibold text-text-primary">{c.title}</span>
                    </div>
                    <div className="text-[11.5px] text-text-muted">{c.subtitle}</div>
                  </button>
                ))}
              </div>

              <div className="mb-1 text-[11px] font-bold uppercase tracking-widest text-text-muted">Configuration</div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-[12px] text-text-muted">Test Type</label>
                  <select
                    value={kind}
                    onChange={(e) => setKind(e.target.value as TestKind)}
                    className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary focus:border-accent focus:outline-none"
                  >
                    {CARDS.map((c) => (
                      <option key={c.kind} value={c.kind}>{c.typeLabel}</option>
                    ))}
                  </select>
                </div>

                {kind !== "chain" && (
                  <div className="flex gap-2">
                    <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-[110px] rounded-md border border-border bg-bg-elevated px-2 py-2 text-[13px] text-text-primary focus:border-accent focus:outline-none">
                      {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8765" className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
                    <button onClick={useActiveRequest} className="shrink-0 whitespace-nowrap rounded-md border border-border px-3 py-2 text-[12px] text-text-secondary hover:bg-bg-hover">
                      Use Active Request
                    </button>
                  </div>
                )}

                {kind === "load" && (
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Virtual Users"><NumberInput value={virtualUsers} onChange={setVirtualUsers} /></Field>
                    <Field label="Duration (seconds)"><NumberInput value={durationSecs} onChange={setDurationSecs} /></Field>
                    <Field label="Requests/VU"><NumberInput value={requestsPerVu} onChange={setRequestsPerVu} /></Field>
                  </div>
                )}

                {kind === "stress" && (
                  <div className="grid grid-cols-4 gap-3">
                    <Field label="Start VUs"><NumberInput value={startVus} onChange={setStartVus} /></Field>
                    <Field label="Peak VUs"><NumberInput value={peakVus} onChange={setPeakVus} /></Field>
                    <Field label="Ramp Duration (s)"><NumberInput value={rampDurationSecs} onChange={setRampDurationSecs} /></Field>
                    <Field label="Hold at Peak (s)"><NumberInput value={holdAtPeakSecs} onChange={setHoldAtPeakSecs} /></Field>
                  </div>
                )}

                {kind === "spike" && (
                  <div className="grid grid-cols-5 gap-3">
                    <Field label="Base VUs"><NumberInput value={baseVus} onChange={setBaseVus} /></Field>
                    <Field label="Spike VUs"><NumberInput value={spikeVus} onChange={setSpikeVus} /></Field>
                    <Field label="Pre-spike (s)"><NumberInput value={preSpikeSecs} onChange={setPreSpikeSecs} /></Field>
                    <Field label="Spike (s)"><NumberInput value={spikeSecs} onChange={setSpikeSecs} /></Field>
                    <Field label="Post-spike (s)"><NumberInput value={postSpikeSecs} onChange={setPostSpikeSecs} /></Field>
                  </div>
                )}

                {kind === "soak" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Virtual Users"><NumberInput value={soakVus} onChange={setSoakVus} /></Field>
                    <Field label="Duration">
                      <select value={soakDurationSecs} onChange={(e) => setSoakDurationSecs(Number(e.target.value))} className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary focus:border-accent focus:outline-none">
                        {SOAK_PRESETS.map((p) => (
                          <option key={p.secs} value={p.secs}>{p.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                )}

                {(kind === "load" || kind === "stress" || kind === "spike" || kind === "soak") && (
                  <div>
                    <button onClick={() => setAdvancedOpen((o) => !o)} className="flex items-center gap-1 text-[12px] text-text-muted hover:text-text-primary">
                      {advancedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {advancedOpen ? "Hide Advanced" : "Advanced Options"}
                    </button>
                    {advancedOpen && (
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        <Field label="Ramp-up (s)"><NumberInput value={rampUpSecs} onChange={setRampUpSecs} /></Field>
                        <Field label="Think time (ms)"><NumberInput value={thinkTimeMs} onChange={setThinkTimeMs} /></Field>
                        <Field label="Timeout (s)"><NumberInput value={timeoutSecs} onChange={setTimeoutSecs} /></Field>
                        <label className="col-span-3 flex items-center gap-2 text-[12px] text-text-secondary">
                          <input type="checkbox" checked={followRedirects} onChange={(e) => setFollowRedirects(e.target.checked)} className="h-3.5 w-3.5 accent-accent" />
                          Follow redirects
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {kind === "response" && (
                  <div className="space-y-2">
                    {assertions.map((a) => (
                      <div key={a.id} className="flex items-center gap-2">
                        <input type="checkbox" checked={a.enabled} onChange={(e) => updateAssertion(a.id, { enabled: e.target.checked })} className="h-4 w-4 shrink-0 accent-accent" />
                        <select value={a.field} onChange={(e) => updateAssertion(a.id, { field: e.target.value as AssertionField })} className="w-[150px] shrink-0 rounded-md border border-border bg-bg-elevated px-2 py-2 text-[12.5px] text-text-primary focus:border-accent focus:outline-none">
                          {(Object.keys(FIELD_LABEL) as AssertionField[]).map((f) => (
                            <option key={f} value={f}>{FIELD_LABEL[f]}</option>
                          ))}
                        </select>
                        {a.field === "header" && (
                          <input value={a.headerName} onChange={(e) => updateAssertion(a.id, { headerName: e.target.value })} placeholder="Header name" className="w-[130px] shrink-0 rounded-md border border-border bg-bg-elevated px-2 py-2 text-[12.5px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
                        )}
                        {a.field === "jsonPath" && (
                          <input value={a.jsonPath} onChange={(e) => updateAssertion(a.id, { jsonPath: e.target.value })} placeholder="user.address.city" className="w-[150px] shrink-0 rounded-md border border-border bg-bg-elevated px-2 py-2 font-mono text-[12.5px] text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none" />
                        )}
                        <select value={a.operator} onChange={(e) => updateAssertion(a.id, { operator: e.target.value as AssertionOp })} className="w-[100px] shrink-0 rounded-md border border-border bg-bg-elevated px-2 py-2 text-[12.5px] text-text-primary focus:border-accent focus:outline-none">
                          {OPERATORS.map((op) => (
                            <option key={op} value={op}>{op}</option>
                          ))}
                        </select>
                        <input value={a.value} onChange={(e) => updateAssertion(a.id, { value: e.target.value })} disabled={a.operator === "exists" || a.operator === "!exists"} className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 text-[12.5px] text-text-primary focus:border-accent focus:outline-none disabled:opacity-40" />
                        <button onClick={() => removeAssertion(a.id)} className="shrink-0 text-text-muted hover:text-status-error">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button onClick={addAssertion} className="flex items-center gap-1.5 text-[13px] font-medium text-accent hover:opacity-80">
                      <Plus size={14} /> Add Assertion
                    </button>
                  </div>
                )}

                {kind === "chain" && (
                  <div>
                    <label className="mb-1 block text-[12px] text-text-muted">Collection</label>
                    <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary focus:border-accent focus:outline-none">
                      <option value="">Select a collection...</option>
                      {flatCollections.map((c) => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                    <button onClick={() => setAdvancedOpen((o) => !o)} className="mt-3 flex items-center gap-1 text-[12px] text-text-muted hover:text-text-primary">
                      {advancedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {advancedOpen ? "Hide Advanced" : "Advanced Options"}
                    </button>
                    {advancedOpen && (
                      <div className="mt-3 flex items-center gap-3">
                        <label className="text-[12px] text-text-secondary">Delay between requests (ms)</label>
                        <input type="number" value={runner.delayMs} onChange={(e) => runner.setDelay(Number(e.target.value))} className="w-24 rounded-md border border-border bg-bg-elevated px-2 py-1 text-text-primary focus:border-accent focus:outline-none" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleRun}
                  disabled={kind !== "chain" && !url}
                  className="flex items-center gap-1.5 rounded-md bg-accent px-5 py-2 text-[13px] font-semibold text-black hover:bg-accent-hover disabled:opacity-40"
                >
                  <Play size={14} /> Run Test
                </button>
              </div>
            </>
          ) : (
            <ResultsView
              kind={kind}
              onBack={handleBack}
              load={load}
              checkRunning={checkRunning}
              checkResponse={checkResponse}
              checkError={checkError}
              assertions={assertions}
              runner={runner}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] text-text-muted">{label}</label>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary focus:border-accent focus:outline-none"
    />
  );
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

interface ResultsViewProps {
  kind: TestKind;
  onBack: () => void;
  load: LoadTestState;
  checkRunning: boolean;
  checkResponse: ApiResponse | null;
  checkError: string | null;
  assertions: Assertion[];
  runner: RunnerState;
}

function ResultsView(props: ResultsViewProps) {
  const { kind, onBack, load, checkRunning, checkResponse, checkError, assertions, runner } = props;
  if (kind === "response") {
    return <ResponseCheckResults onBack={onBack} running={checkRunning} response={checkResponse} error={checkError} assertions={assertions} />;
  }
  if (kind === "chain") {
    return <ChainResults onBack={onBack} runner={runner} />;
  }
  return <LoadTestResults onBack={onBack} load={load} />;
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="text-[11px] uppercase tracking-wide text-text-muted">{label}</div>
      <div className={clsx("mt-1 text-[20px] font-semibold", accent ?? "text-text-primary")}>{value}</div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-16 items-end gap-[2px]">
      {values.slice(-60).map((v, i) => (
        <div key={i} className="w-1.5 rounded-t" style={{ height: `${Math.max(4, (v / max) * 100)}%`, backgroundColor: color }} />
      ))}
    </div>
  );
}

function LoadTestResults({ onBack, load }: { onBack: () => void; load: LoadTestState }) {
  const p = load.progress;
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary">
          <RotateCcw size={13} /> Back to config
        </button>
        {load.isRunning ? (
          <button onClick={() => load.stop()} className="flex items-center gap-1.5 rounded-md bg-status-error px-4 py-1.5 text-[13px] font-medium text-white hover:opacity-90">
            <Square size={13} /> Stop
          </button>
        ) : (
          <span className="flex items-center gap-1.5 text-[13px] font-medium text-status-success">
            <CheckCircle2 size={14} /> Done
          </span>
        )}
      </div>

      {!p ? (
        <div className="py-16 text-center text-text-muted">Starting test…</div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-4 gap-3">
            <StatCard label="Active VUs" value={String(p.activeVus)} />
            <StatCard label="Total Requests" value={String(p.totalRequests)} />
            <StatCard label="Requests/sec" value={p.rps.toFixed(1)} />
            <StatCard label="Elapsed" value={`${(p.elapsedMs / 1000).toFixed(1)}s`} />
          </div>

          <div className="mb-4 grid grid-cols-5 gap-3">
            <StatCard label="Avg" value={`${p.latencyAvgMs.toFixed(0)}ms`} />
            <StatCard label="p50" value={`${p.p50Ms}ms`} />
            <StatCard label="p90" value={`${p.p90Ms}ms`} />
            <StatCard label="p95" value={`${p.p95Ms}ms`} />
            <StatCard label="p99" value={`${p.p99Ms}ms`} />
          </div>

          <div className="mb-4 grid grid-cols-5 gap-3">
            <StatCard label="2xx" value={String(p.success)} accent="text-status-success" />
            <StatCard label="3xx" value={String(p.redirect)} accent="text-yellow-500" />
            <StatCard label="4xx" value={String(p.clientError)} accent="text-orange-500" />
            <StatCard label="5xx" value={String(p.serverError)} accent="text-status-error" />
            <StatCard label="Network Errors" value={String(p.networkError)} accent="text-status-error" />
          </div>

          <div className="rounded-md border border-border p-3">
            <div className="mb-2 text-[11px] uppercase tracking-wide text-text-muted">Requests/sec over time</div>
            <Sparkline values={load.history.map((h: LoadTestProgress) => h.rps)} color="#F54900" />
          </div>
        </>
      )}
    </div>
  );
}

interface AssertionResult {
  assertion: Assertion;
  actual: unknown;
  passed: boolean;
}

function ResponseCheckResults({
  onBack, running, response, error, assertions,
}: {
  onBack: () => void;
  running: boolean;
  response: ApiResponse | null;
  error: string | null;
  assertions: Assertion[];
}) {
  const extract = (a: Assertion): unknown => {
    if (!response) return undefined;
    switch (a.field) {
      case "status":
        return response.status;
      case "responseTime":
        return response.timing.totalMs;
      case "body":
        return response.body;
      case "header": {
        const key = Object.keys(response.headers).find((k) => k.toLowerCase() === a.headerName.toLowerCase());
        return key ? response.headers[key] : undefined;
      }
      case "jsonPath": {
        try {
          const json = JSON.parse(response.body);
          return a.jsonPath.split(".").reduce((acc: any, key: string) => acc?.[key], json);
        } catch {
          return undefined;
        }
      }
    }
  };

  const evaluate = (a: Assertion, actual: unknown): boolean => {
    const s = String(actual ?? "");
    switch (a.operator) {
      case "=":
        return String(actual) === a.value;
      case "!=":
        return String(actual) !== a.value;
      case "contains":
        return s.includes(a.value);
      case "!contains":
        return !s.includes(a.value);
      case "<":
        return Number(actual) < Number(a.value);
      case ">":
        return Number(actual) > Number(a.value);
      case "regex":
        try {
          return new RegExp(a.value).test(s);
        } catch {
          return false;
        }
      case "exists":
        return actual !== undefined && actual !== null;
      case "!exists":
        return actual === undefined || actual === null;
    }
  };

  const results: AssertionResult[] = response
    ? assertions.filter((a) => a.enabled).map((a) => ({ assertion: a, actual: extract(a), passed: evaluate(a, extract(a)) }))
    : [];
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary">
        <RotateCcw size={13} /> Back to config
      </button>

      {running && <div className="py-16 text-center text-text-muted">Sending request…</div>}
      {error && <div className="rounded-md border border-status-error/30 bg-status-error/10 p-3 text-[13px] text-status-error">{error}</div>}

      {response && (
        <>
          <div className="mb-4 flex items-center gap-4 text-[13px]">
            <span className={response.status < 400 ? "font-semibold text-status-success" : "font-semibold text-status-error"}>
              {response.status} {response.statusText}
            </span>
            <span className="text-text-muted">{response.timing.totalMs}ms</span>
            <span className="text-text-muted">{response.sizeBytes}B</span>
            <span className="ml-auto font-medium text-text-primary">{passedCount}/{results.length} passed</span>
          </div>
          <div className="space-y-1.5">
            {results.map(({ assertion, actual, passed }) => (
              <div key={assertion.id} className={clsx("flex items-center justify-between rounded-md border px-3 py-2 text-[13px]", passed ? "border-status-success/30 bg-status-success/5" : "border-status-error/30 bg-status-error/5")}>
                <span className="text-text-primary">
                  {FIELD_LABEL[assertion.field]} {assertion.operator} {assertion.value}
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-text-muted">got: {String(actual ?? "—")}</span>
                  {passed ? <CheckCircle2 size={15} className="text-status-success" /> : <X size={15} className="text-status-error" />}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChainResults({ onBack, runner }: { onBack: () => void; runner: RunnerState }) {
  const passed = runner.results.filter((r) => r.status === "passed").length;
  const failed = runner.results.filter((r) => r.status === "failed" || r.status === "error").length;
  const done = runner.results.filter((r) => r.status !== "pending" && r.status !== "running").length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary">
          <RotateCcw size={13} /> Back to config
        </button>
        <span className="text-[13px] text-text-muted">{passed} passed, {failed} failed, {done}/{runner.results.length} done</span>
      </div>
      <div className="space-y-1.5">
        {runner.results.map((r: RunnerResult) => (
          <div key={r.requestId} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-[13px]">
            <span className="w-14 shrink-0 font-semibold text-text-secondary">{r.method}</span>
            <span className="flex-1 truncate text-text-primary">{r.name}</span>
            {r.response && <span className="text-text-muted">{r.response.status}</span>}
            {r.durationMs > 0 && <span className="text-text-muted">{r.durationMs}ms</span>}
            <span
              className={clsx(
                "text-[11px] font-semibold uppercase",
                r.status === "passed" && "text-status-success",
                (r.status === "failed" || r.status === "error") && "text-status-error",
                r.status === "running" && "text-accent"
              )}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}