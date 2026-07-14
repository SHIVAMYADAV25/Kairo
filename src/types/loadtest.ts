export type LoadTestShape = "load" | "stress" | "spike" | "soak";

export interface LoadTestConfig {
  testId: string;
  shape: LoadTestShape;
  method: string;
  url: string;
  headers: [string, string][];
  body: string | null;

  virtualUsers?: number;
  durationSecs?: number;
  requestsPerVu?: number;

  startVus?: number;
  peakVus?: number;
  rampDurationSecs?: number;
  holdAtPeakSecs?: number;

  baseVus?: number;
  spikeVus?: number;
  preSpikeSecs?: number;
  spikeSecs?: number;
  postSpikeSecs?: number;

  rampUpSecs: number;
  thinkTimeMs: number;
  timeoutSecs: number;
  followRedirects: boolean;
}

export interface LoadTestProgress {
  testId: string;
  elapsedMs: number;
  activeVus: number;
  totalRequests: number;
  success: number;
  redirect: number;
  clientError: number;
  serverError: number;
  networkError: number;
  rps: number;
  latencyAvgMs: number;
  latencyMinMs: number;
  latencyMaxMs: number;
  p50Ms: number;
  p90Ms: number;
  p95Ms: number;
  p99Ms: number;
  done: boolean;
}