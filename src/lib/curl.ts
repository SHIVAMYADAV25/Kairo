import type { ApiRequest, AuthConfig, FormDataField, HttpMethod, KeyValuePair, RequestBody } from "@/types";
import { uid } from "@/lib/factories";

// ---------------------------------------------------------------------------
// cURL <-> ApiRequest. Two directions:
//  - parseCurl(): pasted "curl ..." string -> partial ApiRequest fields
//  - buildCurl(): ApiRequest -> "curl ..." string (with {{vars}} resolved if
//    an env var map is passed in)
// ---------------------------------------------------------------------------

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const s = input.replace(/\\\r?\n/g, " ").trim();
  let i = 0;
  while (i < s.length) {
    while (i < s.length && /\s/.test(s[i])) i++;
    if (i >= s.length) break;
    let token = "";
    if (s[i] === "'" || s[i] === '"') {
      const quote = s[i];
      i++;
      while (i < s.length && s[i] !== quote) {
        if (s[i] === "\\" && quote === '"' && i + 1 < s.length) {
          token += s[i + 1];
          i += 2;
        } else {
          token += s[i];
          i++;
        }
      }
      i++;
    } else {
      while (i < s.length && !/\s/.test(s[i])) {
        if (s[i] === "\\" && i + 1 < s.length) {
          token += s[i + 1];
          i += 2;
        } else {
          token += s[i];
          i++;
        }
      }
    }
    tokens.push(token);
  }
  return tokens;
}

export interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KeyValuePair[];
  params: KeyValuePair[];
  body: RequestBody;
  auth: AuthConfig;
}

export function parseCurl(raw: string): ParsedCurl | null {
  const input = raw.trim();
  if (!input || !/^curl\b/i.test(input)) return null;

  const tokens = tokenize(input);
  let idx = 0;
  if (tokens[idx]?.toLowerCase() === "curl") idx++;

  let method: HttpMethod = "GET";
  let url = "";
  const headers: KeyValuePair[] = [];
  const dataParts: string[] = [];
  let dataIsUrlEncodedForm = false;
  let hasExplicitData = false;
  const formFields: FormDataField[] = [];
  let isMultipart = false;
  let basicAuthRaw: string | null = null;

  const takeValue = () => tokens[++idx];

  while (idx < tokens.length) {
    const t = tokens[idx];
    if (t === "-X" || t === "--request") {
      method = (takeValue() || "GET").toUpperCase() as HttpMethod;
    } else if (t === "-H" || t === "--header") {
      const h = takeValue() || "";
      const sep = h.indexOf(":");
      if (sep > -1) {
        headers.push({ id: uid(), key: h.slice(0, sep).trim(), value: h.slice(sep + 1).trim(), enabled: true });
      }
    } else if (t === "-d" || t === "--data" || t === "--data-raw" || t === "--data-ascii") {
      dataParts.push(takeValue() || "");
      hasExplicitData = true;
      if (method === "GET") method = "POST";
    } else if (t === "--data-binary") {
      const v = takeValue() || "";
      dataParts.push(v.startsWith("@") ? `<binary file: ${v.slice(1)}>` : v);
      hasExplicitData = true;
      if (method === "GET") method = "POST";
    } else if (t === "--data-urlencode") {
      dataParts.push(takeValue() || "");
      dataIsUrlEncodedForm = true;
      hasExplicitData = true;
      if (method === "GET") method = "POST";
    } else if (t === "-F" || t === "--form") {
      const v = takeValue() || "";
      const eq = v.indexOf("=");
      if (eq > -1) {
        const key = v.slice(0, eq);
        const value = v.slice(eq + 1);
        const isFile = value.startsWith("@");
        formFields.push({ id: uid(), key, type: isFile ? "file" : "text", value: isFile ? value.slice(1) : value, enabled: true });
      }
      isMultipart = true;
      if (method === "GET") method = "POST";
    } else if (t === "-u" || t === "--user") {
      basicAuthRaw = takeValue() || "";
    } else if (t === "-b" || t === "--cookie") {
      headers.push({ id: uid(), key: "Cookie", value: takeValue() || "", enabled: true });
    } else if (t === "-A" || t === "--user-agent") {
      headers.push({ id: uid(), key: "User-Agent", value: takeValue() || "", enabled: true });
    } else if (t === "-e" || t === "--referer") {
      headers.push({ id: uid(), key: "Referer", value: takeValue() || "", enabled: true });
    } else if (t === "--url") {
      url = takeValue() || "";
    } else if (
      t === "-k" || t === "--insecure" || t === "-i" || t === "--include" ||
      t === "-s" || t === "--silent" || t === "-v" || t === "--verbose" ||
      t === "-L" || t === "--location" || t === "--compressed"
    ) {
      // flags with no value we don't model on the request — skip.
    } else if (!t.startsWith("-") && !url) {
      url = t;
    }
    idx++;
  }

  if (!url) return null;

  // Split the query string out of the URL into the Params table, matching
  // how the rest of the app models params separately from the raw URL.
  const params: KeyValuePair[] = [];
  const qIndex = url.indexOf("?");
  if (qIndex > -1) {
    const qs = url.slice(qIndex + 1);
    url = url.slice(0, qIndex);
    for (const pair of qs.split("&")) {
      if (!pair) continue;
      const [k, v = ""] = pair.split("=");
      try {
        params.push({ id: uid(), key: decodeURIComponent(k), value: decodeURIComponent(v), enabled: true });
      } catch {
        params.push({ id: uid(), key: k, value: v, enabled: true });
      }
    }
  }

  let auth: AuthConfig = { type: "none" };
  if (basicAuthRaw !== null) {
    const [username, password = ""] = basicAuthRaw.split(":");
    auth = { type: "basic", basic: { username, password } };
  }

  let body: RequestBody = { type: "none" };
  if (isMultipart) {
    body = { type: "form-data", formData: formFields };
  } else if (hasExplicitData) {
    const contentType = headers.find((h) => h.key.toLowerCase() === "content-type")?.value ?? "";
    const joined = dataParts.join("&");
    if (contentType.includes("application/json")) {
      body = { type: "json", json: joined };
    } else if (dataIsUrlEncodedForm || contentType.includes("x-www-form-urlencoded")) {
      const pairs: KeyValuePair[] = joined.split("&").filter(Boolean).map((p) => {
        const [k, v = ""] = p.split("=");
        return { id: uid(), key: decodeURIComponent(k), value: decodeURIComponent(v), enabled: true };
      });
      body = { type: "url-encoded", urlEncoded: pairs };
    } else {
      const trimmed = joined.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        body = { type: "json", json: joined };
      } else {
        body = { type: "raw", raw: { content: joined, language: "text" } };
      }
    }
  }

  return { method, url, headers, params, body, auth };
}

export function resolveTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (m, name) => (name in vars ? vars[name] : m));
}

function shellQuote(value: string): string {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

/** Builds a copy-pasteable multi-line cURL command from a request. Pass in
 * the active environment's variables to resolve `{{VAR}}` placeholders;
 * omit to keep them literal in the output. */
export function buildCurl(request: ApiRequest, vars: Record<string, string> = {}): string {
  const r = (s: string) => resolveTemplate(s, vars);

  let url = r(request.url);
  const enabledParams = request.params.filter((p) => p.enabled && p.key);
  if (enabledParams.length) {
    const qs = enabledParams.map((p) => `${encodeURIComponent(r(p.key))}=${encodeURIComponent(r(p.value))}`).join("&");
    url += (url.includes("?") ? "&" : "?") + qs;
  }

  const lines: string[] = [`curl -X ${request.method} ${shellQuote(url)}`];

  for (const h of request.headers.filter((h) => h.enabled && h.key)) {
    lines.push(`  -H ${shellQuote(`${r(h.key)}: ${r(h.value)}`)}`);
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    lines.push(`  -H ${shellQuote(`Authorization: Bearer ${r(request.auth.bearer.token)}`)}`);
  } else if (request.auth.type === "basic" && request.auth.basic) {
    lines.push(`  -u ${shellQuote(`${r(request.auth.basic.username)}:${r(request.auth.basic.password)}`)}`);
  } else if (request.auth.type === "api-key" && request.auth.apiKey?.location === "header") {
    lines.push(`  -H ${shellQuote(`${request.auth.apiKey.key}: ${r(request.auth.apiKey.value)}`)}`);
  }

  switch (request.body.type) {
    case "json":
      lines.push(`  -H ${shellQuote("Content-Type: application/json")}`);
      lines.push(`  -d ${shellQuote(r(request.body.json ?? ""))}`);
      break;
    case "raw":
      lines.push(`  -d ${shellQuote(r(request.body.raw?.content ?? ""))}`);
      break;
    case "url-encoded":
      for (const p of (request.body.urlEncoded ?? []).filter((p) => p.enabled && p.key)) {
        lines.push(`  --data-urlencode ${shellQuote(`${r(p.key)}=${r(p.value)}`)}`);
      }
      break;
    case "form-data":
      for (const f of (request.body.formData ?? []).filter((f) => f.enabled && f.key)) {
        const value = f.type === "file" ? `@${f.value}` : r(f.value);
        lines.push(`  -F ${shellQuote(`${f.key}=${value}`)}`);
      }
      break;
    case "binary":
      if (request.body.binaryFilePath) lines.push(`  --data-binary ${shellQuote(`@${request.body.binaryFilePath}`)}`);
      break;
  }

  return lines.join(" \\\n");
}