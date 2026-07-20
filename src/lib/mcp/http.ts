import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  authenticateMcpCredential,
  extractBearerCredential,
  type McpAuthenticationResult,
  type McpPrincipal,
} from "@/lib/mcp/auth";
import {
  createSupabaseMcpRepository,
  type McpRepository,
} from "@/lib/mcp/repository";
import { createPaperlineMcpServer } from "@/lib/mcp/server";
import {
  consumeWorkspaceRateLimit,
  type WorkspaceRateLimitResult,
} from "@/lib/security/rate-limit";

export const MCP_MAX_REQUEST_BYTES = 128 * 1024;

export interface McpHttpDependencies {
  authenticate?: (credential: string) => Promise<McpAuthenticationResult>;
  consumeRateLimit?: (principal: McpPrincipal) => Promise<WorkspaceRateLimitResult>;
  repositoryFactory?: (principal: McpPrincipal) => McpRepository;
  env?: NodeJS.ProcessEnv;
}

export async function handlePaperlineMcpRequest(
  request: Request,
  dependencies: McpHttpDependencies = {},
): Promise<Response> {
  const env = dependencies.env ?? process.env;
  const targetError = validateRequestTarget(request, env);
  if (targetError) return targetError;

  const credential = extractBearerCredential(request.headers.get("authorization"));
  if (!credential) return unauthorizedResponse();

  const authenticate = dependencies.authenticate ?? authenticateMcpCredential;
  const authResult = await authenticate(credential);
  if (!authResult.ok) {
    return authResult.status === 503
      ? jsonRpcError(503, -32603, authResult.error)
      : unauthorizedResponse();
  }

  if (request.method !== "POST") {
    return jsonRpcError(405, -32000, "method_not_allowed", null, {
      Allow: "POST",
    });
  }

  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim();
  if (contentType !== "application/json") {
    return jsonRpcError(415, -32600, "content_type_must_be_application_json");
  }

  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MCP_MAX_REQUEST_BYTES) {
    return jsonRpcError(413, -32600, "request_too_large");
  }

  const consumeRateLimit =
    dependencies.consumeRateLimit ??
    ((principal: McpPrincipal) =>
      consumeWorkspaceRateLimit({
        workspaceId: principal.workspaceId,
        action: "mcp_request",
        limit: 120,
        windowSeconds: 60,
      }));
  const rateLimit = await consumeRateLimit(authResult.principal);
  if (rateLimit.status === "unavailable") {
    return jsonRpcError(503, -32603, "request_limit_unavailable");
  }
  if (rateLimit.status === "limited") {
    return jsonRpcError(429, -32000, "rate_limit_exceeded", null, {
      "Retry-After": String(rateLimit.retryAfterSeconds),
      "X-RateLimit-Limit": "120",
      "X-RateLimit-Remaining": "0",
    });
  }

  const parsed = await parseBoundedJson(request);
  if (!parsed.ok) return parsed.response;
  if (Array.isArray(parsed.body)) {
    return jsonRpcError(400, -32600, "batch_requests_not_supported");
  }

  const repository =
    dependencies.repositoryFactory?.(authResult.principal) ??
    createSupabaseMcpRepository();
  const server = createPaperlineMcpServer(authResult.principal, repository);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  try {
    await server.connect(transport);
    const response = await transport.handleRequest(request, {
      parsedBody: parsed.body,
    });
    return withSecurityHeaders(response);
  } catch (error) {
    console.error("[mcp.http] protocol handler failed", {
      credentialId: authResult.principal.credentialId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonRpcError(500, -32603, "internal_error");
  } finally {
    await server.close().catch(() => undefined);
  }
}

function validateRequestTarget(
  request: Request,
  env: NodeJS.ProcessEnv,
): Response | null {
  const url = new URL(request.url);
  const host = (request.headers.get("host") ?? url.host).toLowerCase();
  const allowedHosts = csvSet(env.PAPERLINE_MCP_ALLOWED_HOSTS);
  const vercelHost = env.VERCEL_URL?.trim().toLowerCase();

  // Preview deployment hosts are immutable and assigned after upload. Vercel
  // supplies the exact current hostname at runtime, so trust only that value —
  // never a broad *.vercel.app wildcard.
  if (vercelHost && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.vercel\.app$/.test(vercelHost)) {
    allowedHosts.add(vercelHost);
  }

  if (env.NODE_ENV !== "production") {
    allowedHosts.add("localhost:3000");
    allowedHosts.add("127.0.0.1:3000");
  }

  if (allowedHosts.size === 0) {
    return jsonRpcError(503, -32603, "mcp_host_policy_unconfigured");
  }
  if (!allowedHosts.has(host)) {
    return jsonRpcError(421, -32600, "host_not_allowed");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    const allowedOrigins = csvSet(env.PAPERLINE_MCP_ALLOWED_ORIGINS);
    if (env.NEXT_PUBLIC_APP_URL) {
      try {
        allowedOrigins.add(new URL(env.NEXT_PUBLIC_APP_URL).origin);
      } catch {
        return jsonRpcError(503, -32603, "mcp_origin_policy_invalid");
      }
    }
    if (vercelHost) allowedOrigins.add(`https://${vercelHost}`);
    if (!allowedOrigins.has(origin.toLowerCase())) {
      return jsonRpcError(403, -32600, "origin_not_allowed");
    }
  }

  return null;
}

async function parseBoundedJson(
  request: Request,
): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  let bytes: ArrayBuffer;
  try {
    bytes = await request.arrayBuffer();
  } catch {
    return { ok: false, response: jsonRpcError(400, -32700, "invalid_json") };
  }

  if (bytes.byteLength > MCP_MAX_REQUEST_BYTES) {
    return { ok: false, response: jsonRpcError(413, -32600, "request_too_large") };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, body: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: jsonRpcError(400, -32700, "invalid_json") };
  }
}

function unauthorizedResponse(): Response {
  return jsonRpcError(401, -32001, "invalid_agent_credential", null, {
    "WWW-Authenticate": 'Bearer realm="paperline-mcp"',
  });
}

function jsonRpcError(
  status: number,
  code: number,
  message: string,
  id: string | number | null = null,
  headers: Record<string, string> = {},
): Response {
  return withSecurityHeaders(
    Response.json(
      { jsonrpc: "2.0", error: { code, message }, id },
      { status, headers },
    ),
  );
}

function withSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function csvSet(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  );
}
