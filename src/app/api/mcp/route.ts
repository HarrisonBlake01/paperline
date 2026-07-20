import { handlePaperlineMcpRequest } from "@/lib/mcp/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  return handlePaperlineMcpRequest(request);
}

export async function GET(request: Request) {
  return handlePaperlineMcpRequest(request);
}

export async function DELETE(request: Request) {
  return handlePaperlineMcpRequest(request);
}
