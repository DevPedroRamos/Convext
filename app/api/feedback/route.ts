import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createFeedback, listFeedbacks } from "@/lib/demands";
import { requireAreaAccess } from "@/lib/profile";
import { createFeedbackSchema } from "@/lib/validations/demand";

export async function GET() {
  const { response } = await requireAreaAccess("feedback");
  if (response) return response;
  const feedbacks = await listFeedbacks();
  return NextResponse.json({ feedbacks });
}

export async function POST(request: Request) {
  const { response } = await requireAreaAccess("feedback");
  if (response) return response;
  const body = await request.json().catch(() => null);
  const parsed = createFeedbackSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await createFeedback(parsed.data);
  if (result.error === "Cliente não encontrado.") return NextResponse.json({ error: result.error }, { status: 400 });
  if (result.error || !result.feedback) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/feedback");
  return NextResponse.json({ feedback: result.feedback }, { status: 201 });
}
