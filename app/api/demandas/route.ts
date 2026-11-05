import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createCreatorDemand, listDemands } from "@/lib/demands";
import { isOperations, requireOnboardedUser } from "@/lib/profile";
import { createCreatorDemandSchema } from "@/lib/validations/demand";

export async function GET() {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const demands = await listDemands();
  return NextResponse.json({ demands });
}

export async function POST(request: Request) {
  const { profile, response } = await requireOnboardedUser();
  if (response) return response;
  if (!isOperations(profile)) return NextResponse.json({ error: "Sem permissão para cadastrar demanda." }, { status: 403 });
  const body = await request.json().catch(() => null);
  const parsed = createCreatorDemandSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await createCreatorDemand(parsed.data);
  if (result.error === "Cliente não encontrado." || result.error === "Selecione um creator válido.") {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  if (result.error || !result.demand) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/demandas");
  return NextResponse.json({ demand: result.demand }, { status: 201 });
}
