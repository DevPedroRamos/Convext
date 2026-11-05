import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createDemandFile, listDemandFiles } from "@/lib/demand-files";
import { canUploadCreatives } from "@/lib/demand-access";
import { getDemandById } from "@/lib/demands";
import { isOperations, requireOnboardedUser } from "@/lib/profile";
import { createDemandFileSchema } from "@/lib/validations/demand";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const { id } = await context.params;
  const demand = await getDemandById(id);
  if (!demand) return NextResponse.json({ error: "Demanda não encontrada." }, { status: 404 });
  const files = await listDemandFiles(id);
  return NextResponse.json({ files });
}

export async function POST(request: Request, context: RouteContext) {
  const { user, profile, response } = await requireOnboardedUser();
  if (response) return response;
  const { id } = await context.params;
  const demand = await getDemandById(id);
  if (!demand) return NextResponse.json({ error: "Demanda não encontrada." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const parsed = createDemandFileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.kind === "creative" && !canUploadCreatives(demand, user?.id)) {
    return NextResponse.json({ error: "Só o creator responsável sobe criativo após concluir ou receber variação." }, { status: 403 });
  }
  if (parsed.data.kind === "reference" && !isOperations(profile) && demand.createdBy !== user?.id) {
    return NextResponse.json({ error: "Sem permissão para anexar referência." }, { status: 403 });
  }

  const result = await createDemandFile(id, parsed.data, user!.id);
  if (result.error || !result.file) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/demandas");
  return NextResponse.json({ file: result.file }, { status: 201 });
}
