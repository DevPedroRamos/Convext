import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteClient, getClientById, updateClient } from "@/lib/clients";
import { isAdmin, requireAreaAccess } from "@/lib/profile";
import { clientSchema } from "@/lib/validations/client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("clientes");
  if (response) return response;
  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
  return NextResponse.json({ client });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { response } = await requireAreaAccess("clientes");
  if (response) return response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateClient(id, parsed.data);
  if (result.error || !result.client) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/clientes");
  revalidatePath(`/app/clientes/${id}`);
  return NextResponse.json({ client: result.client });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { profile, response } = await requireAreaAccess("clientes");
  if (response) return response;
  if (!isAdmin(profile)) return NextResponse.json({ error: "Somente admin pode excluir." }, { status: 403 });
  const { id } = await context.params;
  const error = await deleteClient(id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  revalidatePath("/app/clientes");
  return NextResponse.json({ ok: true });
}
