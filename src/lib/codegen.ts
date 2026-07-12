import type { ApiRequest, Environment } from "@/types";
import { buildCurl, resolveTemplate } from "./curl";

export type CodegenLanguage =
  | "curl" | "javascript-fetch" | "javascript-axios" | "nodejs"
  | "python-requests" | "go" | "rust-reqwest" | "java" | "php";

export const CODEGEN_LANGUAGES: { id: CodegenLanguage; label: string; monacoLang: string }[] = [
  { id: "curl", label: "cURL", monacoLang: "shell" },
  { id: "javascript-fetch", label: "JavaScript (Fetch)", monacoLang: "javascript" },
  { id: "javascript-axios", label: "JavaScript (Axios)", monacoLang: "javascript" },
  { id: "nodejs", label: "Node.js", monacoLang: "javascript" },
  { id: "python-requests", label: "Python (Requests)", monacoLang: "python" },
  { id: "go", label: "Go", monacoLang: "go" },
  { id: "rust-reqwest", label: "Rust (reqwest)", monacoLang: "rust" },
  { id: "java", label: "Java", monacoLang: "java" },
  { id: "php", label: "PHP", monacoLang: "php" },
];

interface Ctx {
  method: string;
  url: string;
  headers: { key: string; value: string }[];
  jsonBody: string | null;
  rawBody: string | null;
  formPairs: { key: string; value: string }[];
}

function envVars(env?: Environment | null): Record<string, string> {
  const vars: Record<string, string> = {};
  if (env) for (const v of env.variables) if (v.enabled) vars[v.key] = v.value;
  return vars;
}

function buildCtx(request: ApiRequest, env?: Environment | null): Ctx {
  const vars = envVars(env);
  const r = (s: string) => resolveTemplate(s, vars);

  let url = r(request.url);
  const enabledParams = request.params.filter((p) => p.enabled && p.key);
  if (enabledParams.length) {
    const qs = enabledParams.map((p) => `${encodeURIComponent(r(p.key))}=${encodeURIComponent(r(p.value))}`).join("&");
    url += (url.includes("?") ? "&" : "?") + qs;
  }

  const headers = request.headers.filter((h) => h.enabled && h.key).map((h) => ({ key: r(h.key), value: r(h.value) }));
  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers.push({ key: "Authorization", value: `Bearer ${r(request.auth.bearer.token)}` });
  } else if (request.auth.type === "api-key" && request.auth.apiKey?.location === "header") {
    headers.push({ key: request.auth.apiKey.key, value: r(request.auth.apiKey.value) });
  } else if (request.auth.type === "basic" && request.auth.basic) {
    headers.push({ key: "Authorization", value: `Basic <base64(${r(request.auth.basic.username)}:${r(request.auth.basic.password)})>` });
  }

  let jsonBody: string | null = null;
  let rawBody: string | null = null;
  const formPairs: Ctx["formPairs"] = [];

  switch (request.body.type) {
    case "json":
      jsonBody = r(request.body.json ?? "{}");
      break;
    case "raw":
      rawBody = r(request.body.raw?.content ?? "");
      break;
    case "url-encoded":
      for (const p of (request.body.urlEncoded ?? []).filter((p) => p.enabled && p.key)) {
        formPairs.push({ key: r(p.key), value: r(p.value) });
      }
      break;
    case "form-data":
      for (const f of (request.body.formData ?? []).filter((f) => f.enabled && f.key)) {
        formPairs.push({ key: f.key, value: f.type === "file" ? `@${f.value}` : r(f.value) });
      }
      break;
    case "binary":
      rawBody = request.body.binaryFilePath ? `<binary: ${request.body.binaryFilePath}>` : null;
      break;
  }

  return { method: request.method, url, headers, jsonBody, rawBody, formPairs };
}

function jsHeadersObj(headers: { key: string; value: string }[]): string {
  if (!headers.length) return "{}";
  return "{\n" + headers.map((h) => `    "${h.key}": ${JSON.stringify(h.value)}`).join(",\n") + "\n  }";
}

function bodyForJs(ctx: Ctx): string | null {
  if (ctx.jsonBody !== null) return `JSON.stringify(${ctx.jsonBody || "{}"})`;
  if (ctx.rawBody !== null) return JSON.stringify(ctx.rawBody);
  if (ctx.formPairs.length) {
    const entries = ctx.formPairs.map((p) => `["${p.key}", ${JSON.stringify(p.value)}]`).join(", ");
    return `new URLSearchParams([${entries}]).toString()`;
  }
  return null;
}

function genFetch(ctx: Ctx): string {
  const body = bodyForJs(ctx);
  const lines = [
    `const response = await fetch(${JSON.stringify(ctx.url)}, {`,
    `  method: "${ctx.method}",`,
    `  headers: ${jsHeadersObj(ctx.headers)},`,
  ];
  if (body) lines.push(`  body: ${body},`);
  lines.push(`});`, ``, `const data = await response.text();`, `console.log(data);`);
  return lines.join("\n");
}

function genAxios(ctx: Ctx): string {
  const body = bodyForJs(ctx);
  return [
    `import axios from "axios";`,
    ``,
    `const response = await axios({`,
    `  method: "${ctx.method.toLowerCase()}",`,
    `  url: ${JSON.stringify(ctx.url)},`,
    `  headers: ${jsHeadersObj(ctx.headers)},`,
    body ? `  data: ${ctx.jsonBody !== null ? (ctx.jsonBody || "{}") : body},` : "",
    `});`,
    ``,
    `console.log(response.data);`,
  ].filter(Boolean).join("\n");
}

function genNode(ctx: Ctx): string {
  return [
    `const https = require("https");`,
    ``,
    `const url = new URL(${JSON.stringify(ctx.url)});`,
    `const options = {`,
    `  method: "${ctx.method}",`,
    `  hostname: url.hostname,`,
    `  path: url.pathname + url.search,`,
    `  headers: ${jsHeadersObj(ctx.headers)},`,
    `};`,
    ``,
    `const req = https.request(options, (res) => {`,
    `  let data = "";`,
    `  res.on("data", (chunk) => (data += chunk));`,
    `  res.on("end", () => console.log(data));`,
    `});`,
    ``,
    `req.on("error", console.error);`,
    ctx.jsonBody !== null ? `req.write(JSON.stringify(${ctx.jsonBody || "{}"}));` : ctx.rawBody !== null ? `req.write(${JSON.stringify(ctx.rawBody)});` : "",
    `req.end();`,
  ].filter(Boolean).join("\n");
}

function genPython(ctx: Ctx): string {
  const lines = [`import requests`, ``, `url = ${JSON.stringify(ctx.url)}`];
  if (ctx.headers.length) {
    lines.push(`headers = {`);
    for (const h of ctx.headers) lines.push(`    "${h.key}": ${JSON.stringify(h.value)},`);
    lines.push(`}`);
  }
  let bodyArg = "";
  if (ctx.jsonBody !== null) {
    lines.push(`payload = ${ctx.jsonBody || "{}"}`);
    bodyArg = "json=payload";
  } else if (ctx.formPairs.length) {
    lines.push(`payload = {`);
    for (const p of ctx.formPairs) lines.push(`    "${p.key}": ${JSON.stringify(p.value)},`);
    lines.push(`}`);
    bodyArg = "data=payload";
  } else if (ctx.rawBody !== null) {
    lines.push(`payload = ${JSON.stringify(ctx.rawBody)}`);
    bodyArg = "data=payload";
  }
  lines.push(
    ``,
    `response = requests.request(`,
    `    "${ctx.method}",`,
    `    url,`,
    ctx.headers.length ? `    headers=headers${bodyArg ? ", " + bodyArg : ""},` : bodyArg ? `    ${bodyArg},` : "",
    `)`,
    ``,
    `print(response.text)`
  );
  return lines.filter(Boolean).join("\n");
}

function genGo(ctx: Ctx): string {
  const body = ctx.jsonBody !== null ? (ctx.jsonBody || "{}") : (ctx.rawBody ?? "");
  return [
    `package main`,
    ``,
    `import (`,
    `\t"fmt"`,
    `\t"io"`,
    `\t"net/http"`,
    `\t"strings"`,
    `)`,
    ``,
    `func main() {`,
    `\tpayload := strings.NewReader(\`${body.replace(/`/g, "'")}\`)`,
    `\treq, _ := http.NewRequest("${ctx.method}", "${ctx.url}", payload)`,
    ...ctx.headers.map((h) => `\treq.Header.Add("${h.key}", "${h.value}")`),
    ``,
    `\tres, err := http.DefaultClient.Do(req)`,
    `\tif err != nil {`,
    `\t\tpanic(err)`,
    `\t}`,
    `\tdefer res.Body.Close()`,
    `\tbody, _ := io.ReadAll(res.Body)`,
    `\tfmt.Println(string(body))`,
    `}`,
  ].join("\n");
}

function genRust(ctx: Ctx): string {
  const body = ctx.jsonBody !== null ? (ctx.jsonBody || "{}") : (ctx.rawBody ?? "");
  return [
    `let client = reqwest::Client::new();`,
    `let res = client`,
    `    .request(reqwest::Method::${ctx.method}, "${ctx.url}")`,
    ...ctx.headers.map((h) => `    .header("${h.key}", "${h.value}")`),
    body ? `    .body(r#"${body}"#)` : "",
    `    .send()`,
    `    .await?;`,
    ``,
    `let body = res.text().await?;`,
    `println!("{}", body);`,
  ].filter(Boolean).join("\n");
}

function genJava(ctx: Ctx): string {
  const body = ctx.jsonBody !== null ? (ctx.jsonBody || "{}") : (ctx.rawBody ?? "");
  return [
    `HttpClient client = HttpClient.newHttpClient();`,
    `HttpRequest request = HttpRequest.newBuilder()`,
    `    .uri(URI.create("${ctx.url}"))`,
    ...ctx.headers.map((h) => `    .header("${h.key}", "${h.value}")`),
    body
      ? `    .method("${ctx.method}", HttpRequest.BodyPublishers.ofString("${body.replace(/"/g, '\\"')}"))`
      : `    .method("${ctx.method}", HttpRequest.BodyPublishers.noBody())`,
    `    .build();`,
    ``,
    `HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());`,
    `System.out.println(response.body());`,
  ].join("\n");
}

function genPhp(ctx: Ctx): string {
  const body = ctx.jsonBody !== null ? (ctx.jsonBody || "{}") : (ctx.rawBody ?? "");
  return [
    `<?php`,
    `$curl = curl_init();`,
    ``,
    `curl_setopt_array($curl, [`,
    `    CURLOPT_URL => "${ctx.url}",`,
    `    CURLOPT_RETURNTRANSFER => true,`,
    `    CURLOPT_CUSTOMREQUEST => "${ctx.method}",`,
    body ? `    CURLOPT_POSTFIELDS => '${body.replace(/'/g, "\\'")}',` : "",
    ctx.headers.length
      ? `    CURLOPT_HTTPHEADER => [\n${ctx.headers.map((h) => `        "${h.key}: ${h.value}"`).join(",\n")}\n    ],`
      : "",
    `]);`,
    ``,
    `$response = curl_exec($curl);`,
    `curl_close($curl);`,
    `echo $response;`,
  ].filter(Boolean).join("\n");
}

export function generateSnippet(lang: CodegenLanguage, request: ApiRequest, env?: Environment | null): string {
  if (lang === "curl") return buildCurl(request, envVars(env));
  const ctx = buildCtx(request, env);
  switch (lang) {
    case "javascript-fetch": return genFetch(ctx);
    case "javascript-axios": return genAxios(ctx);
    case "nodejs": return genNode(ctx);
    case "python-requests": return genPython(ctx);
    case "go": return genGo(ctx);
    case "rust-reqwest": return genRust(ctx);
    case "java": return genJava(ctx);
    case "php": return genPhp(ctx);
  }
}