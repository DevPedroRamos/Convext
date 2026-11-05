import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireOnboardedUser } from "@/lib/profile";
import { updateOwnPresence } from "@/lib/team-status";
import { presenceSchema } from "@/lib/validations/team-status";

export async function PATCH(request: Request) {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const body = await request.json().catch(() => null);
  const parsed = presenceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const result = await updateOwnPresence(parsed.data.available);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app", "layout");
  revalidatePath("/app/equipe");
  return NextResponse.json({ ok: true });
}
