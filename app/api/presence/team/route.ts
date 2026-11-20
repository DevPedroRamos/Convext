import { NextResponse } from "next/server";
import { requireOnboardedUser } from "@/lib/profile";
import { listPresenceSnapshot } from "@/lib/team-status";

export async function GET() {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  return NextResponse.json({ members: await listPresenceSnapshot() });
}
