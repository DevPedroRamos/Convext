import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requestVariation } from "@/lib/demands";
import { isAdmin, requireOnboardedUser } from "@/lib/profile";
import { requestVariationSchema } from "@/lib/validations/demand";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { profile, response } = await requireOnboardedUser();
  if (response) return response;
  if (!isAdmin(profile)) return NextResponse.json({ error: "Sem permissão para solicitar variação." }, { status: 403 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = requestVariationSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await requestVariation(id, parsed.data);
  if (result.error === "Demanda de criativo não encontrada." || !result.demand) {
    return NextResponse.json({ error: result.error || "Demanda de criativo não encontrada." }, { status: result.error === "Demanda de criativo não encontrada." ? 404 : 500 });
  }
  revalidatePath("/app/demandas");
  return NextResponse.json({ demand: result.demand });
}
