import clsx from "clsx";
import type { AuthType, RequestTab } from "@/types";
import { useTabStore } from "@/stores/tabStore";

const AUTH_TYPES: { id: AuthType; label: string }[] = [
  { id: "none", label: "None" },
  { id: "bearer", label: "Bearer" },
  { id: "basic", label: "Basic" },
  { id: "api-key", label: "API Key" },
  { id: "oauth2", label: "OAuth2" },
];

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[12px] text-text-secondary">
      {label}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-none bg-bg-elevated px-3 py-2 font-mono text-[13px] text-text-primary focus:border-accent focus:outline-none focus:border-none"
      />
    </label>
  );
}

interface Props {
  tab: RequestTab;
}

export function AuthTab({ tab }: Props) {
  const { updateRequest } = useTabStore();
  const auth = tab.request.auth;

  const setAuth = (patch: Partial<typeof auth>) =>
    updateRequest(tab.id, { auth: { ...auth, ...patch } });

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      {/* Top Section: Horizontal Button Navigation */}
      <div className="flex flex-wrap gap-2  border-border pb-1">
        {AUTH_TYPES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAuth({ type: a.id })}
            className={clsx(
              "rounded-md px-3.5 py-1 text-[11px] font-normal tracking-wide transition-all",
              auth.type === a.id
                ? "bg-[#F54900] text-[#FDFFFF] font-semibold "
                : "bg-[var(--c-1a1a1a)] text-[var(--c-a3a3a3)] border-none hover:bg-[var(--c-262626)] hover:text-text-primary"
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Bottom Section: Inputs / Content */}
      <div className="space-y-3 max-w-md">
        {auth.type === "none" && (
          <div className="text-text-muted text-[13px]">
            This request does not use any authorization.
          </div>
        )}

        {auth.type === "bearer" && (
          <Field
            label="Token"
            value={auth.bearer?.token ?? ""}
            onChange={(v) => setAuth({ bearer: { token: v } })}
            placeholder={"Enter token..."}
          />
        )}

        {auth.type === "basic" && (
          <>
            <Field
              label="Username"
              value={auth.basic?.username ?? ""}
              onChange={(v) => setAuth({ basic: { username: v, password: auth.basic?.password ?? "" } })}
              placeholder={"Username"}
            />
            <Field
              label="Password"
              type="password"
              value={auth.basic?.password ?? ""}
              onChange={(v) => setAuth({ basic: { username: auth.basic?.username ?? "", password: v } })}
              placeholder={"Password"}
            />
          </>
        )}

        {auth.type === "api-key" && (
          <>
            <Field
              label="Key"
              value={auth.apiKey?.key ?? ""}
              onChange={(v) =>
                setAuth({
                  apiKey: {
                    key: v,
                    value: auth.apiKey?.value ?? "",
                    location: auth.apiKey?.location ?? "header",
                  },
                })
              }
              placeholder={"Header name or query param"}
            />
            <Field
              label="Value"
              value={auth.apiKey?.value ?? ""}
              onChange={(v) =>
                setAuth({
                  apiKey: {
                    key: auth.apiKey?.key ?? "",
                    value: v,
                    location: auth.apiKey?.location ?? "header",
                  },
                })
              }
              placeholder={"API key value"}
            />
            <label className="flex flex-col gap-1 text-[12px] text-text-secondary">
              Add to
              <select
                value={auth.apiKey?.location ?? "header"}
                onChange={(e) =>
                  setAuth({
                    apiKey: {
                      key: auth.apiKey?.key ?? "",
                      value: auth.apiKey?.value ?? "",
                      location: e.target.value as "header" | "query" | "cookie",
                    },
                  })
                }
                className="rounded-md border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="header">Header</option>
                <option value="query">Query Params</option>
                <option value="cookie">Cookie</option>
              </select>
            </label>
          </>
        )}

        {auth.type === "oauth2" && (
          <div className="text-text-muted text-[13px]">
            OAuth2 flow configuration — grant type, auth URL, token URL, client id/secret, scope.
          </div>
        )}
      </div>
    </div>
  );
}