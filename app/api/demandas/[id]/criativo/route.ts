import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { canRequestCreative } from "@/lib/demand-access";
import { getFeedbackById, requestCreativeFromFeedback } from "@/lib/demands";
import { isOperations, requireOnboardedUser } from "@/lib/profile";
import { requestCreativeSchema } from "@/lib/validations/demand";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { user, profile, response } = await requireOnboardedUser();
  if (response) return response;
  const { id } = await context.params;
  const source = await getFeedbackById(id);
  if (!source) return NextResponse.json({ error: "Feedback não encontrado." }, { status: 404 });
  if (!canRequestCreative(source, user?.id, isOperations(profile))) {
    return NextResponse.json({ error: "Sem permissão para solicitar criativo." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const parsed = requestCreativeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await requestCreativeFromFeedback(id, parsed.data);
  if (result.error === "Selecione um creator válido.") return NextResponse.json({ error: result.error }, { status: 400 });
  if (result.error || !result.demand) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/demandas");
  revalidatePath("/app/feedback");
  return NextResponse.json({ demand: result.demand }, { status: 201 });
}
