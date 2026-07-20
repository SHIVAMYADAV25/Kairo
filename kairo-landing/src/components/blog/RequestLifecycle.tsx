const steps = [
  {
    title: "Load environment variables",
    detail: "Pull the active environment's key/value pairs from SQLite. If no environment is selected, start with an empty map.",
    code: "storage::environments::get_variables(&pool, env_id)",
  },
  {
    title: "Run the pre-request script",
    detail: "If the request has a pre-request script, spin up a fresh QuickJS context and run it before anything else — a script that sets pm.environment.set() needs to affect the request that's about to fire, not the next one.",
    code: "run_pre_request_script(&script, &mut env_vars)",
  },
  {
    title: "Substitute {{VAR}} placeholders",
    detail: "Walk the URL, headers, params and body, swapping every {{key}} for its value — using the (possibly script-updated) variable map from step 2.",
    code: "substitute_vars_in_request(request, &env_vars)",
  },
  {
    title: "Persist any variable changes",
    detail: "If the script changed a variable, write it back to the environment in SQLite, so the Environments panel and the next request both see it.",
    code: "storage::environments::merge_variables(&pool, env_id, &env_vars)",
  },
  {
    title: "Get a client — pooled, not rebuilt",
    detail: "Ask the ClientPool for a client matching this request's settings (timeout / redirects / SSL / cookies). Same settings as last time means the same warm client comes back, connection and DNS cache intact — only a genuinely new settings combo triggers a real build_client().",
    code: "let client = client_pool.get_or_build(&request).await?;",
  },
  {
    title: "Send it, and time it",
    detail: "Fire the request. An Instant is captured right before send() and read right after the first byte comes back — that's the TTFB you see in the performance panel.",
    code: "let response = builder.send().await?;",
  },
  {
    title: "Shape the response",
    detail: "Status, headers, cookies, and body get normalized into one ApiResponse struct — the same shape whether the server replied in 4ms or 4s.",
    code: "ApiResponse { status, headers, cookies, body, timing }",
  },
  {
    title: "Run the test script, ship it back",
    detail: "If there's a post-response script, it runs against the real response (assertions, extraction). The finished ApiResponse is serialized to JSON and returned across the IPC boundary as the resolved value of invoke().",
    code: "Ok(response) // → Promise<ApiResponse> in the UI",
  },
];

export default function RequestLifecycle() {
  return (
    <div className="my-8 not-prose">
      <div className="relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-white/10" aria-hidden="true" />
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={s.title} className="relative pl-10">
              <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-neutral-900 border border-orange-500/40 flex items-center justify-center text-[12px] font-mono font-bold text-orange-400">
                {i + 1}
              </div>
              <div className="glass-card rounded-lg p-4">
                <h4 className="text-sm font-semibold text-white mb-1">{s.title}</h4>
                <p className="text-sm text-neutral-400 leading-relaxed mb-2">{s.detail}</p>
                <code className="block text-[11px] font-mono text-neutral-500 bg-black/30 rounded px-2 py-1.5 overflow-x-auto whitespace-pre">
                  {s.code}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}