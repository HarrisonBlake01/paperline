import { isReadinessAuthorized, runReadinessChecks } from "@/lib/readiness";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function GET(request: Request) {
  if (
    !isReadinessAuthorized(
      request.headers.get("authorization"),
      process.env.PAPERLINE_READINESS_TOKEN,
    )
  ) {
    return Response.json(
      { ready: false, error: "unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
          "WWW-Authenticate": 'Bearer realm="paperline-readiness"',
        },
      },
    );
  }

  const result = await runReadinessChecks();
  return Response.json(result, {
    status: result.ready ? 200 : 503,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
