import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteFeedbackType, updateFeedbackType } from "@/lib/feedback-types";
import { requireAreaAccess } from "@/lib/profile";
import { feedbackTypeSchema } from "@/lib/validations/feedback-type";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("gestao");
  if (response) return response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = feedbackTypeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateFeedbackType(id, parsed.data);
  if (result.error || !result.type) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/gestao");
  revalidatePath("/app/feedback");
  return NextResponse.json({ type: result.type });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("gestao");
  if (response) return response;
  const { id } = await context.params;
  const error = await deleteFeedbackType(id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  revalidatePath("/app/gestao");
  revalidatePath("/app/feedback");
  return NextResponse.json({ ok: true });
}
