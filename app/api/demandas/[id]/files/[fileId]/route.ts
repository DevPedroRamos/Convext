import { NextResponse } from "next/server";
import { createDemandFileSignedUrl, getDemandFile } from "@/lib/demand-files";
import { getDemandById } from "@/lib/demands";
import { requireOnboardedUser } from "@/lib/profile";

type RouteContext = { params: Promise<{ id: string; fileId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireOnboardedUser();
  if (response) return response;
  const { id, fileId } = await context.params;
  const demand = await getDemandById(id);
  if (!demand) return NextResponse.json({ error: "Demanda não encontrada." }, { status: 404 });
  const file = await getDemandFile(id, fileId);
  if (!file) return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
  const result = await createDemandFileSignedUrl(file.path);
  if (result.error || !result.url) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ url: result.url, name: file.name });
}
