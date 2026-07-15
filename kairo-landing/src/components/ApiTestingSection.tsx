import DetailRow from "./DetailRow";
import { QuickStartVisual, StressTestVisual } from "./ApiTestingVisuals";
import { AssertionsVisual, ChainTestVisual } from "./ApiTestingVisuals2";

export default function ApiTestingSection() {
  return (
    <section id="api-testing" className="relative py-24 overflow-hidden">
      <div className="glow w-[700px] h-[700px] bg-red-500/[0.06] top-0 left-1/3" />
      <div className="glow w-[500px] h-[500px] bg-orange-500/[0.05] bottom-1/4 right-0" />
      <div className="glow w-[400px] h-[400px] bg-purple-500/[0.04] top-1/2 left-0" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/[0.06] text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-red-400 font-semibold uppercase tracking-wider">Built-in API Testing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            <span className="text-white">Stress test your APIs</span>
            <br />
            <span className="bg-gradient-to-r from-red-400 via-amber-400 to-blue-400 bg-clip-text text-transparent">
              without leaving the app
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Load tests, stress tests, spike tests, soak tests, response assertions, and chain
            tests — all built in. No external tools, no YAML configs, no CLI. Just click and go.
          </p>
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="Stress Testing"
            title="Find the breaking point"
            description="Gradually ramp from 1 to 500 virtual users and watch your API's response times, throughput, and error rates in real time. Kairo automatically detects where your service starts to degrade."
            bullets={[
              "Ramp from 1 to 500 VUs with linear, stepped, or exponential curves",
              "Live metric cards: avg/p50/p90/p95/p99 response times",
              "Automatic breaking point detection when error rate exceeds threshold",
              "Response time distribution with color-coded buckets",
              "Timeline table with per-interval VU count, RPS, and percentiles",
            ]}
            visual={<StressTestVisual />}
            accent="text-red-400"
            bullet="text-red-400"
          />
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="6 Test Types"
            title="One click to start testing"
            description="Pick a preset and run. Smart defaults auto-fill your current request's URL, method, headers, and auth — so you're 3 clicks from a running test. Customize anything, or just hit Go."
            bullets={[
              "6 preset cards: Load, Stress, Spike, Soak, Assertions, Chain",
              '"Use Active Request" auto-fills URL, method, headers, and body',
              "Spike tests show pre-spike / spike / recovery phases with recovery time",
              "Soak tests support durations from 1 minute to 1 hour",
            ]}
            visual={<QuickStartVisual />}
            reverse
            accent="text-amber-400"
            bullet="text-amber-400"
          />
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="Chain Tests"
            title="Test complete API flows"
            description="Chain requests into sequences that pass data between steps. Extract a token from login, use it to fetch a user, then update their profile — all validated automatically."
            bullets={[
              "Extract variables from JSON paths, headers, or status codes",
              "Variables auto-injected into subsequent requests",
              "Per-step assertions with actual vs. expected comparison",
              "Visual flow diagram with pass/fail indicators",
              "Stop on first failure or run all steps",
            ]}
            visual={<ChainTestVisual />}
            accent="text-cyan-400"
            bullet="text-cyan-400"
          />
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="Response Assertions"
            title="Validate every detail"
            description="Define assertions on status codes, response times, headers, body content, and JSON paths. Get instant pass/fail results with actual vs. expected values side by side."
            bullets={[
              "11 operators: equals, contains, regex, less than, greater than, and more",
              "JSON path assertions with dot-notation traversal",
              "Header and body content matching",
              "Response time thresholds with color-coded results",
            ]}
            visual={<AssertionsVisual />}
            reverse
            accent="text-emerald-400"
            bullet="text-emerald-400"
          />
        </div>

        <div className="text-center pt-8">
          <div className="glass-card inline-flex items-center gap-4 rounded-xl px-6 py-4">
            <div className="flex -space-x-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-cyan-500 ring-2 ring-neutral-950" />
            </div>
            <span className="text-sm text-neutral-300">
              6 test types · Up to 500 VUs · Real-time metrics · Built into your API client
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
