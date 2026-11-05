import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createFeedbackType, listFeedbackTypes } from "@/lib/feedback-types";
import { requireAreaAccess, requireOnboardedUser } from "@/lib/profile";
import { feedbackTypeSchema } from "@/lib/validations/feedback-type";

export async function GET() {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const types = await listFeedbackTypes();
  return NextResponse.json({ types });
}

export async function POST(request: Request) {
  const { response } = await requireAreaAccess("gestao");
  if (response) return response;
  const body = await request.json().catch(() => null);
  const parsed = feedbackTypeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await createFeedbackType(parsed.data);
  if (result.error || !result.type) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/gestao");
  revalidatePath("/app/feedback");
  return NextResponse.json({ type: result.type }, { status: 201 });
}
