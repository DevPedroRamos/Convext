import { NextResponse } from "next/server";
import { listDemands } from "@/lib/demands";
import { requireOnboardedUser } from "@/lib/profile";

export async function GET() {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const demands = await listDemands();
  return NextResponse.json({ demands });
}
