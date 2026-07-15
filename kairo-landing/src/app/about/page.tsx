"use client";

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Gochi_Hand } from "next/font/google";
import BlogHeader from "@/components/blog/BlogHeader";
import Footer from "@/components/Footer";
import EvolutionMockup from "@/components/blog/EvolutionMockup";
import ArchitectureDiagram from "@/components/blog/ArchitectureDiagram";
import RequestLifecycle from "@/components/blog/RequestLifecycle";
import CodeBlock from "@/components/blog/CodeBlock";
import BuildYourOwnChecklist from "@/components/blog/BuildYourOwnChecklist";
import SakuraFall from "@/components/SakuraFall";

const gochiHand = Gochi_Hand({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-neutral-300 leading-relaxed mb-6 text-[15px] sm:text-base">{children}</p>;
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl sm:text-2xl font-bold text-white mt-16 mb-5 tracking-tight border-b border-white/5 pb-2">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base sm:text-lg font-semibold text-neutral-200 mt-10 mb-3 tracking-tight">{children}</h3>;
}

export default function AboutPage() {
  return (
    /* Added explicit layout positioning context so the leaves drop endlessly to the true bottom */
    <div className="min-h-screen bg-neutral-950 text-neutral-200 overflow-x-hidden relative w-full flex flex-col justify-between">
      <BlogHeader />

      {/* Renders drifting leaves globally spanning the full stacked document node height */}
      <SakuraFall />

      <main className="relative pt-32 sm:pt-40 pb-24 z-10 flex-grow">
        {/* Background Atmosphere */}
        <div className="glow w-[500px] h-[500px] bg-orange-500/5 top-0 left-1/2 -translate-x-1/2 pointer-events-none" />

        <article className="relative mx-auto max-w-3xl px-6">
          
          {/* ================= CLEAN ASYMMETRIC OVERVIEW ROW ================= */}
          <header className="flex flex-col-reverse md:flex-row items-center gap-8 md:gap-12 mb-16 pb-12 border-b border-white/5">
            
            {/* Left Side Open Context Intro */}
            <div className="flex-1 text-left">
              <div className={`${gochiHand.className} text-orange-400 text-2xl sm:text-3xl leading-snug tracking-wide`}>
                <p className="mb-2">Yoo dum dum,</p>
                <p className="text-neutral-200 text-lg sm:text-xl font-sans font-normal tracking-tight normal-case leading-relaxed">
                  You really want to know how to make Kairo? Like, really? 
                  Before you copy my homework, you should probably know why I actually made this thing. 
                </p>
              </div>
            </div>

            {/* Right Side Frame Badge */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 shrink-0 relative">
              <div className="glass-card w-full h-full rounded-2xl overflow-hidden p-1.5 bg-white/5 border border-white/10 shadow-xl relative aspect-square">
                <Image
                  src="/bio.png"
                  alt="Creator Avatar Graphic"
                  fill
                  sizes="(max-w-768px) 112px, 144px"
                  priority
                  className="object-cover object-center rounded-xl opacity-90"
                />
              </div>
            </div>

          </header>

          {/* Core Content Flow */}
          <P>
            Basically, I was doing some freelance work, and the clients wanted me to learn Rust because the project required it. So, yeah, I was sitting there pretending to follow tutorials, and then I realized: why am I just wasting time reading when I could just build something real? I stopped looking at the toy examples, started writing code, and ended up making Kairo. That is the entire origin story.
          </P>
          <P>
            So instead of doing my actual job, I fell down a massive architecture hole. If you came here looking for a clean, formal developer case study, you are in the completely wrong place. But if you want to see how a two-day procrastination detour turned into a fully operational cross-platform client, stick around. 
          </P>

          <H2 id="the-crap-version">Let&apos;s start from the actual start</H2>
          <P>
            I didn&apos;t sit down to build &quot;a multi-protocol API client with a scripting
            sandbox and a load-testing suite.&quot; That came much later. The actual pitch, to
            myself, was a lot dumber: I just wanted to make Postman, but fast. Really fast. And
            I wanted an excuse to actually use whatever Rust optimization tricks I&apos;d been
            reading about instead of just reading about them.
          </P>
          <P>
            So I opened a blank file, dumped every idea I had into what I&apos;ll charitably
            call my <code className="text-orange-300 bg-white/5 px-1.5 py-0.5 rounded text-[13px] font-mono">brain.txt</code>,
            and built the smallest possible thing that could send an HTTP request and show you
            what came back. I will call it crap, because it was crap: two inputs and one send
            button. That&apos;s genuinely it. Is that a Postman replacement? No. Was it mine?
            Yes.
          </P>

          <EvolutionMockup />

          <P>
            After that first version worked — after I actually saw a real response come back
            from a real API — I fell into the UI rabbit hole. Tabs. Params. Headers. Auth.
            Environments. A real response viewer instead of a raw text dump. None of it
            happened in one sitting; it happened in a loop of building something, hating how
            it looked, and rebuilding it slightly better. Somewhere in that loop I got better
            at Rust and better at UI at more or less the same time, mostly because I had no
            choice — there was no one else to hand either half to.
          </P>

          <H2 id="architecture">How Kairo is actually built</H2>
          <P>
            This is the part most &quot;I built an app&quot; posts skip, so let&apos;s actually
            go through it. Kairo is a <strong className="text-white font-semibold">Tauri</strong> app,
            not an Electron one. The practical difference: Electron ships an entire Chromium
            browser and a Node.js runtime inside your app. Tauri ships neither — it uses the
            operating system&apos;s own WebView to render the UI, and everything else is a
            single native Rust binary. That&apos;s the actual reason Kairo starts in under two
            seconds and sits under 80MB of RAM at idle; it&apos;s not a marketing line, it&apos;s
            just what you get by not bundling a browser inside your app.
          </P>
          <P>
            The UI layer is React, TypeScript, and Vite — nothing unusual there. State is split
            into small <span className="font-mono text-neutral-400 text-sm">zustand</span> stores
            per feature (<span className="font-mono text-neutral-400 text-sm">tabStore</span>,{" "}
            <span className="font-mono text-neutral-400 text-sm">socketStore</span>,{" "}
            <span className="font-mono text-neutral-400 text-sm">environmentStore</span>, and so
            on) instead of one giant global store, so a WebSocket message coming in doesn&apos;t
            re-render your request tabs. Monaco (the editor VS Code uses) handles the body and
            script editors. All of that lives in the WebView and knows almost nothing about how
            a request actually gets sent — it just asks the Rust side to do it.
          </P>

          <ArchitectureDiagram />

          <P>
            The interesting part is the bridge in the middle. Tauri gives the frontend two
            fundamentally different ways to talk to Rust, and Kairo uses both, deliberately:
          </P>
          <ul className="list-disc list-outside pl-5 space-y-2 text-neutral-300 mb-6 text-sm sm:text-base">
            <li>
              <span className="font-mono text-orange-300 text-sm">invoke()</span> — a
              request/response call, like calling a function that happens to live in another
              process. This is how <span className="font-mono text-sm text-neutral-400">execute_request</span>,{" "}
              <span className="font-mono text-sm text-neutral-400">save_request</span>, and most
              of the ~30 commands work: the UI calls it, awaits a promise, gets an answer back.
            </li>
            <li>
              <span className="font-mono text-orange-300 text-sm">emit()</span> /{" "}
              <span className="font-mono text-orange-300 text-sm">listen()</span> — a one-way
              event stream from Rust to the UI. A WebSocket connection or an SSE stream doesn&apos;t
              have a single &quot;response&quot; to wait for — it has an open connection that
              keeps producing messages — so Rust just keeps calling{" "}
              <span className="font-mono text-sm text-neutral-400">app.emit(&quot;ws-message&quot;, …)</span> every
              time one arrives, and the frontend store subscribes once and reacts to each event.
            </li>
          </ul>
          <P>
            Mixing those two up is the easiest way to build a laggy-feeling app — if WebSocket
            messages went through <span className="font-mono text-sm text-neutral-400">invoke()</span>,
            you&apos;d be opening a new IPC round-trip for every single frame. Using{" "}
            <span className="font-mono text-sm text-neutral-400">emit()</span> for streams and{" "}
            <span className="font-mono text-sm text-neutral-400">invoke()</span> for one-shot
            actions is most of why the realtime panels feel instant.
          </P>

          <H3>What actually happens when you hit &quot;Send&quot;</H3>
          <P>
            This is the part of the app that runs the most, so it&apos;s worth walking through
            exactly what happens between clicking Send and seeing a response, step by step:
          </P>

          <RequestLifecycle />

          <H3>The database</H3>
          <P>
            Collections, history, environments, settings, and even your open tabs are stored in
            a single SQLite file — <span className="font-mono text-sm text-neutral-400">kairo.db</span>,
            sitting in the app&apos;s data directory, no server, no external database to run.
            The one deliberate choice here: instead of a single connection wrapped in a mutex
            (the &quot;just make it work&quot; option), Kairo pools connections with{" "}
            <span className="font-mono text-sm text-neutral-400">r2d2</span> and turns on WAL
            (write-ahead logging) mode. In practice that means searching your request history
            doesn&apos;t block on a write that&apos;s happening because a request just finished
            — reads and writes can happen concurrently instead of queueing behind one lock.
          </P>
          <CodeBlock title="src-tauri/src/db/mod.rs" lang="rust">
{`let manager = SqliteConnectionManager::file(db_path).with_init(|conn| {
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
         PRAGMA cache_size = -8000;",
    )
});

let pool = r2d2::Pool::builder().max_size(8).build(manager)?;`}
          </CodeBlock>

          <H3>The scripting sandbox</H3>
          <P>
            Pre-request and test scripts need a real JavaScript engine — but pulling in Node.js
            just to run a few lines of user script would roughly double the size of the app for
            almost no benefit. Instead, Kairo embeds{" "}
            <span className="font-mono text-sm text-neutral-400">rquickjs</span>, a Rust binding
            for QuickJS, directly in the binary. Each script runs in its own throwaway context
            with a tiny, deliberate API surface exposed to it —{" "}
            <span className="font-mono text-sm text-neutral-400">console.log</span> for
            debugging and a <span className="font-mono text-sm text-neutral-400">pm.environment</span> object
            for reading and writing variables — backed by a shared map on the Rust side.
          </P>
          <CodeBlock title="src-tauri/src/commands/scripts.rs" lang="rust">
{`let set_fn = rquickjs::Function::new(ctx.clone(), move |key: String, value: String| {
    set_map.borrow_mut().insert(key, value);
})?;
environment.set("set", set_fn)?;`}
          </CodeBlock>
          <P>
            That&apos;s the entire surface a script gets. No filesystem access, no network
            access from inside the script — it can read and write environment variables and
            print to the console, and that&apos;s it. Small blast radius on purpose.
          </P>

          <H2 id="bugs">Two bugs that taught me more than any tutorial did</H2>
          <P>
            Nothing teaches you a language faster than shipping something broken and having to
            figure out why. Two examples that actually happened while building this:
          </P>

          <H3>The environment that silently did nothing</H3>
          <P>
            The frontend sends requests to Rust as JSON, and JavaScript convention is{" "}
            <span className="font-mono text-sm text-neutral-400">camelCase</span> —{" "}
            <span className="font-mono text-sm text-neutral-400">environmentId</span>. Rust
            convention is <span className="font-mono text-sm text-neutral-400">snake_case</span> —{" "}
            <span className="font-mono text-sm text-neutral-400">environment_id</span>. Without
            telling serde (Rust&apos;s JSON library) to bridge that gap, it looked for a field
            literally called <span className="font-mono text-sm text-neutral-400">environment_id</span> in
            the incoming JSON, didn&apos;t find one, and — because the field was an{" "}
            <span className="font-mono text-sm text-neutral-400">Option&lt;String&gt;</span> —
            silently treated it as <span className="font-mono text-sm text-neutral-400">None</span> instead
            of throwing an error.
          </P>
          <P>
            Nothing crashed. No error in the console. It just meant every request quietly
            ignored whatever environment you had selected, and{" "}
            <span className="font-mono text-sm text-neutral-400">{"{{VAR}}"}</span> placeholders
            never got substituted. That&apos;s the nastiest kind of bug — no stack trace to
            chase, just a feature that felt like it did nothing. One attribute fixed it:
          </P>
          <CodeBlock title="src-tauri/src/commands/http.rs" lang="rust">
{`#[derive(Debug, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteRequestPayload {
    pub request: ApiRequest,
    pub environment_id: Option<String>,
}`}
          </CodeBlock>

          <H3>Scripts that ran a step too late</H3>
          <P>
            The whole point of a pre-request script is that it can change a variable{" "}
            <em>before</em> the request uses it — generating a fresh auth token, say. My first
            version ran variable substitution first and the script after, which meant a script
            calling <span className="font-mono text-sm text-neutral-400">pm.environment.set(&quot;token&quot;, …)</span> was
            updating a value that had already been baked into the request. The script ran, the
            console even logged the new token — it just never made it into the actual request.
            Flipping the order fixed it: load variables → run the pre-request script → substitute{" "}
            <span className="font-mono text-sm text-neutral-400">{"{{VAR}}"}</span> using the
            (now updated) values → persist anything the script changed back to SQLite.
          </P>

          <H3>Why it&apos;s actually fast</H3>
          <P>
            Beyond the Tauri-vs-Electron difference, the release build is tuned specifically for
            a small, fast binary rather than the fastest possible compile:
          </P>
          <CodeBlock title="src-tauri/Cargo.toml" lang="toml">
{`[profile.release]
lto = true             # cross-crate inlining and dead-code elimination
codegen-units = 1     # one codegen unit = more optimization opportunity
opt-level = "z"       # optimize for binary size over raw speed
panic = "abort"       # no unwind tables to carry around
strip = true          # no debug symbols in the shipped binary`}
          </CodeBlock>
          <P>
            None of these are individually dramatic. Together, they&apos;re the difference
            between a binary that feels like it was compiled and one that feels like it was
            actually finished.
          </P>

          <H2 id="build-your-own">If you want to build your own</H2>
          <P>
            You don&apos;t need my exact stack, but if you&apos;re building the same kind of
            tool — a fast, native, do-one-thing-well developer app — this is roughly the
            checklist I&apos;d hand past-me:
          </P>

          <BuildYourOwnChecklist />

          <P>
            The actual roadmap, in the order I&apos;d do it again: get one raw request/response
            round-trip working end to end (even with two inputs and a button — seriously, ship
            that first). Then add a proper request builder with tabs. Then persistence, so
            closing the app doesn&apos;t lose your work. Then environments and variable
            substitution. Everything after that — scripting, WebSocket/SSE, load testing,
            OpenAPI import — is additive; none of it needs to exist for the core loop to be
            useful, and building it in that order means you have something real to use (and
            get annoyed at) the whole way through.
          </P>

          <H2 id="closing">Anyway</H2>
          <P>
            That&apos;s the honest version. Not &quot;I identified a market gap in the API
            tooling space&quot; — I was avoiding a tutorial and ended up building the thing
            you&apos;re using instead. If any part of the architecture above is useful to you,
            steal it. If you build your own version, I&apos;d genuinely like to see it.
          </P>

          <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500 font-mono">Thanks for reading this far.</p>
            <Link
              href="/#get-kairo"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-orange-600 hover:bg-orange-500 text-white active:scale-98"
            >
              Try Kairo
            </Link>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}