// Runtime proxy: /api/* -> ${API_URL}/api/*. Keeps the backend URL server-side
// and avoids CORS. API_URL is read per request, so one Docker image works anywhere.
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const base = process.env.API_URL ?? "http://localhost:8000";
  const upstream = await fetch(`${base}/api/${path.join("/")}${req.nextUrl.search}`, { cache: "no-store" });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}
