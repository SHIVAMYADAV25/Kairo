export const INTROSPECTION_QUERY = `query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    subscriptionType { name }
    types {
      kind
      name
      description
      fields(includeDeprecated: false) {
        name
        description
        args {
          name
          type { ...TypeRef }
          defaultValue
        }
        type { ...TypeRef }
      }
      inputFields {
        name
        type { ...TypeRef }
      }
      enumValues(includeDeprecated: false) {
        name
      }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
}`;

interface IntroTypeRef {
  kind: string;
  name: string | null;
  ofType: IntroTypeRef | null;
}

function typeRefToString(t: IntroTypeRef | null): string {
  if (!t) return "Unknown";
  if (t.kind === "NON_NULL") return `${typeRefToString(t.ofType)}!`;
  if (t.kind === "LIST") return `[${typeRefToString(t.ofType)}]`;
  return t.name ?? "Unknown";
}

export interface IntroField {
  name: string;
  description: string | null;
  args: { name: string; type: string }[];
  type: string;
}

export interface IntroType {
  kind: string;
  name: string;
  description: string | null;
  fields: IntroField[];
}

export interface GraphqlSchema {
  queryTypeName: string | null;
  mutationTypeName: string | null;
  subscriptionTypeName: string | null;
  types: IntroType[];
}

export function parseIntrospection(json: any): GraphqlSchema {
  const schema = json?.data?.__schema;
  if (!schema) throw new Error("Invalid introspection response");
  const types: IntroType[] = (schema.types ?? [])
    .filter((t: any) => !t.name?.startsWith("__"))
    .map((t: any) => ({
      kind: t.kind,
      name: t.name,
      description: t.description ?? null,
      fields: (t.fields ?? []).map((f: any) => ({
        name: f.name,
        description: f.description ?? null,
        args: (f.args ?? []).map((a: any) => ({ name: a.name, type: typeRefToString(a.type) })),
        type: typeRefToString(f.type),
      })),
    }));
  return {
    queryTypeName: schema.queryType?.name ?? null,
    mutationTypeName: schema.mutationType?.name ?? null,
    subscriptionTypeName: schema.subscriptionType?.name ?? null,
    types,
  };
}

export function queryFields(schema: GraphqlSchema): IntroField[] {
  return schema.types.find((t) => t.name === schema.queryTypeName)?.fields ?? [];
}

export function mutationFields(schema: GraphqlSchema): IntroField[] {
  return schema.types.find((t) => t.name === schema.mutationTypeName)?.fields ?? [];
}

/** Naive brace-based re-indenter — good enough for typical queries/mutations
 * without needing a full GraphQL AST parser. */
export function formatGraphQL(input: string): string {
  const lines: string[] = [];
  let indent = 0;
  let current = "";
  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) lines.push("  ".repeat(indent) + trimmed);
    current = "";
  };
  for (const ch of input) {
    if (ch === "{") {
      current += " {";
      flush();
      indent++;
    } else if (ch === "}") {
      flush();
      indent = Math.max(0, indent - 1);
      current = "}";
      flush();
    } else if (ch === "\n") {
      flush();
    } else {
      current += ch;
    }
  }
  flush();
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}