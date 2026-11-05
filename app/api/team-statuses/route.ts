import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAreaAccess, requireOnboardedUser } from "@/lib/profile";
import { createTeamStatus, listTeamStatuses } from "@/lib/team-status";
import { teamStatusSchema } from "@/lib/validations/team-status";

export async function GET() {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const statuses = await listTeamStatuses();
  return NextResponse.json({ statuses });
}

export async function POST(request: Request) {
  const { response } = await requireAreaAccess("gestao");
  if (response) return response;
  const body = await request.json().catch(() => null);
  const parsed = teamStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await createTeamStatus({ name: parsed.data.name, icon: parsed.data.icon });
  if (result.error || !result.status) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app", "layout");
  revalidatePath("/app/gestao");
  revalidatePath("/app/equipe");
  return NextResponse.json({ status: result.status }, { status: 201 });
}
