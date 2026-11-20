import { NextResponse } from "next/server";
import { requireOnboardedUser } from "@/lib/profile";
import { clearOwnLastSeen, touchOwnLastSeen } from "@/lib/team-status";

async function handle(request: Request) {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);
  const leaving = url.searchParams.get("leaving") === "1" || Boolean(body && typeof body === "object" && "leaving" in body && (body as { leaving?: unknown }).leaving);
  const result = leaving ? await clearOwnLastSeen() : await touchOwnLastSeen();
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ ok: true, lastSeenAt: leaving ? null : new Date().toISOString() });
}

export async function POST(request: Request) {
  return handle(request);
}

export async function PATCH(request: Request) {
  return handle(request);
}
