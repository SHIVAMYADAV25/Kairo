import DetailRow from "./DetailRow";
import {
  CollaborationVisual,
  OpenApiVisual,
  RequestBuilderVisual,
  RunnerVisual,
  ScriptingVisual,
} from "./DetailVisuals";

export default function DetailSections() {
  return (
    <section className="relative py-8 overflow-hidden">
      <div className="glow w-[500px] h-[500px] bg-purple-500/8 top-1/4 right-0" />
      <div className="glow w-[400px] h-[400px] bg-orange-500/8 bottom-1/4 left-0" />
      <div className="relative mx-auto max-w-6xl px-6">
        <div className="py-20">
          <DetailRow
            eyebrow="Request Builder"
            title="Build requests with confidence"
            description="A full-featured request builder with syntax-highlighted editors, variable interpolation, and tabbed organization for every part of your request."
            bullets={[
              "Method selector with all HTTP verbs",
              "Variable-highlighted URL bar with inline hints",
              "Tabs for Params, Headers, Body, Auth, and Scripts",
              "Monaco-powered editor with syntax highlighting",
            ]}
            visual={<RequestBuilderVisual />}
          />
        </div>

        <DetailRow
          id="scripts"
          eyebrow="Scripting"
          title="Automate with pre & post scripts"
          description="Write JavaScript that runs before or after your request. Generate tokens, chain requests, validate responses — all with the built-in kr API."
          bullets={[
            "Full kr API for env variables, crypto, and assertions",
            "Integrated console with color-coded output",
            "Chain values between requests automatically",
            "Access response data in post-request scripts",
          ]}
          visual={<ScriptingVisual />}
          reverse
        />

        <DetailRow
          id="runner"
          eyebrow="Collection Runner"
          title="Run entire collections in one click"
          description="Select a collection or folder and execute all its requests sequentially. Watch live progress, see pass/fail results, and let pre/post scripts chain data between requests — like a mini test suite for your APIs."
          bullets={[
            "Sequential execution with live progress bar",
            "Pre/post request scripts run between each request",
            "Cancel mid-run — remaining requests marked as skipped",
            "Run a whole collection or just a specific folder",
          ]}
          visual={<RunnerVisual />}
        />

        <DetailRow
          id="collaboration"
          eyebrow="Collaboration"
          title="Cloud sync, workspaces & public collections"
          description="Push and pull collections to the cloud, collaborate in team workspaces, or share publicly with a link. Git sync via .kairo.json still works too — use whatever fits your workflow."
          bullets={[
            "Cloud push/pull to keep collections in sync across devices",
            "Team workspaces with role-based access control",
            "Public shareable URLs — anyone can import your collection",
            "Git .kairo.json sync still fully supported",
            "Secret variables masked in UI and excluded from exports",
          ]}
          visual={<CollaborationVisual />}
          reverse
        />

        <DetailRow
          id="openapi"
          eyebrow="OpenAPI Import"
          title="Import any OpenAPI spec"
          description="Point Kairo at an OpenAPI file or URL and import every endpoint in seconds. Preview before importing, auto-organize by tags, and support for OpenAPI 2.0 through 3.1."
          bullets={[
            "OpenAPI 2.0 (Swagger) and 3.x support",
            "Import from file or URL",
            "Preview endpoints, tags, and metadata before importing",
            "Auto-organize requests by tags into folders",
          ]}
          visual={<OpenApiVisual />}
        />
      </div>
    </section>
  );
}