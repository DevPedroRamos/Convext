import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createClientRecord, listClients } from "@/lib/clients";
import { requireAreaAccess } from "@/lib/profile";
import { clientSchema } from "@/lib/validations/client";

export async function GET() {
  const { response } = await requireAreaAccess("clientes");
  if (response) return response;
  const clients = await listClients();
  return NextResponse.json({ clients });
}

export async function POST(request: Request) {
  const { response } = await requireAreaAccess("clientes");
  if (response) return response;
  const body = await request.json().catch(() => null);
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await createClientRecord(parsed.data);
  if (result.error || !result.client) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/app/clientes");
  return NextResponse.json({ client: result.client }, { status: 201 });
}
