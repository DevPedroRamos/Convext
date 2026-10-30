import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteFeedback, getFeedbackById, updateFeedback } from "@/lib/demands";
import { isAdmin, requireAreaAccess } from "@/lib/profile";
import { updateFeedbackSchema } from "@/lib/validations/demand";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("feedback");
  if (response) return response;
  const { id } = await context.params;
  const feedback = await getFeedbackById(id);
  if (!feedback) return NextResponse.json({ error: "Feedback não encontrado." }, { status: 404 });
  return NextResponse.json({ feedback });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("feedback");
  if (response) return response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateFeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateFeedback(id, parsed.data);
  if (result.error === "Feedback não encontrado." || !result.feedback) {
    return NextResponse.json({ error: result.error || "Feedback não encontrado." }, { status: result.error === "Feedback não encontrado." ? 404 : 500 });
  }
  revalidatePath("/app/feedback");
  return NextResponse.json({ feedback: result.feedback });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { profile, response } = await requireAreaAccess("feedback");
  if (response) return response;
  if (!isAdmin(profile)) return NextResponse.json({ error: "Somente admin pode excluir." }, { status: 403 });
  const { id } = await context.params;
  const current = await getFeedbackById(id);
  if (!current) return NextResponse.json({ error: "Feedback não encontrado." }, { status: 404 });
  const error = await deleteFeedback(id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  revalidatePath("/app/feedback");
  return NextResponse.json({ ok: true });
}
