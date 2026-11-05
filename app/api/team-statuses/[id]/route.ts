import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAreaAccess } from "@/lib/profile";
import { deleteTeamStatus, updateTeamStatus } from "@/lib/team-status";
import { teamStatusSchema } from "@/lib/validations/team-status";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("gestao");
  if (response) return response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = teamStatusSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateTeamStatus(id, { name: parsed.data.name, icon: parsed.data.icon });
  if (result.error || !result.status) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app", "layout");
  revalidatePath("/app/gestao");
  revalidatePath("/app/equipe");
  return NextResponse.json({ status: result.status });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("gestao");
  if (response) return response;
  const { id } = await context.params;
  const error = await deleteTeamStatus(id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  revalidatePath("/app", "layout");
  revalidatePath("/app/gestao");
  revalidatePath("/app/equipe");
  return NextResponse.json({ ok: true });
}
