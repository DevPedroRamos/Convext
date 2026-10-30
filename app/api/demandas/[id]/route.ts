import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDemandById, updateDemand } from "@/lib/demands";
import { requireOnboardedUser } from "@/lib/profile";
import { updateDemandSchema } from "@/lib/validations/demand";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const { id } = await context.params;
  const demand = await getDemandById(id);
  if (!demand) return NextResponse.json({ error: "Demanda não encontrada." }, { status: 404 });
  return NextResponse.json({ demand });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = updateDemandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateDemand(id, parsed.data);
  if (result.error === "Demanda não encontrada." || !result.demand) {
    return NextResponse.json({ error: result.error || "Demanda não encontrada." }, { status: result.error === "Demanda não encontrada." ? 404 : 500 });
  }
  revalidatePath("/app/demandas");
  revalidatePath("/app/feedback");
  return NextResponse.json({ demand: result.demand });
}
