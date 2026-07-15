import DetailRow from "./DetailRow";
import { GraphQlVisual, GrpcVisual, SseVisual, WebSocketVisual } from "./ProtocolVisuals";

export default function ProtocolsSection() {
  return (
    <section id="protocols" className="relative py-24 overflow-hidden">
      <div className="glow w-[700px] h-[700px] bg-purple-500/[0.06] top-0 left-1/4" />
      <div className="glow w-[500px] h-[500px] bg-cyan-500/[0.05] bottom-1/4 right-0" />
      <div className="glow w-[400px] h-[400px] bg-pink-500/[0.04] top-1/2 left-0" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/[0.06] text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-400 font-semibold uppercase tracking-wider">Multi-Protocol</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Every protocol, one app
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            WebSocket, SSE, GraphQL, and gRPC — all built in with dedicated panels, live streaming,
            and full request/response tooling. No plugins needed.
          </p>
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="WebSocket"
            title="Real-time, two-way messaging"
            description="Connect to any WebSocket endpoint and send/receive messages in real time. Full message log with timestamps, direction indicators, and connection metrics."
            bullets={[
              "Persistent connections with auto-reconnect",
              "Send JSON, text, or binary frames",
              "Live message log with sent/received indicators",
              "Connection metrics: latency, message count, uptime",
              "Custom headers and subprotocol support",
            ]}
            visual={<WebSocketVisual />}
            accent="text-purple-400"
            bullet="text-purple-400"
          />
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="Server-Sent Events"
            title="Stream events as they happen"
            description="Subscribe to SSE endpoints and watch events stream in with type badges, auto-reconnect, and filterable event types."
            bullets={[
              "Live event stream with type-based color coding",
              "Filter events by type: message, alert, heartbeat, custom",
              "Auto-reconnect with last-event-id tracking",
              "Event ID and timestamp for every message",
            ]}
            visual={<SseVisual />}
            reverse
          />
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="GraphQL"
            title="Query with confidence"
            description="A full GraphQL client with syntax-highlighted query editor, schema explorer, and variable support — all in one panel."
            bullets={[
              "Syntax-highlighted query editor with autocomplete",
              "Interactive schema explorer with type navigation",
              "Variables panel with JSON validation",
              "Query, mutation, and subscription support",
              "Introspection-based schema fetching",
            ]}
            visual={<GraphQlVisual />}
            accent="text-pink-400"
            bullet="text-pink-400"
          />
        </div>

        <div className="py-16">
          <DetailRow
            eyebrow="gRPC"
            title="Proto-first API testing"
            description="Load .proto files, browse services and methods, and send requests with JSON payloads. Full request/response inspection with timing."
            bullets={[
              "Load .proto files or connect via server reflection",
              "Browse services, methods, and message types",
              "JSON request editor with proto field hints",
              "Unary, server-streaming, and bidirectional calls",
              "Response timing and metadata inspection",
            ]}
            visual={<GrpcVisual />}
            reverse
            accent="text-teal-400"
            bullet="text-teal-400"
          />
        </div>

        <div className="text-center pt-8">
          <div className="glass-card inline-flex items-center gap-4 rounded-xl px-6 py-4">
            <div className="flex -space-x-1">
              <div className="w-3 h-3 rounded-full bg-purple-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-pink-500 ring-2 ring-neutral-950" />
              <div className="w-3 h-3 rounded-full bg-teal-500 ring-2 ring-neutral-950" />
            </div>
            <span className="text-sm text-neutral-300">All protocols. One app. Zero plugins.</span>
          </div>
        </div>
      </div>
    </section>
  );
}
