import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteCase, getCaseById, updateCase } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";
import { caseSchema } from "@/lib/validations/case";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const record = await getCaseById(id);
  if (!record) return NextResponse.json({ error: "Case não encontrado." }, { status: 404 });
  return NextResponse.json({ case: record });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = caseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateCase(id, parsed.data);
  if (result.error || !result.case) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/app/cases");
  revalidatePath(`/cases/${result.case.slug}`);
  revalidatePath(`/cases/${result.case.id}`);
  return NextResponse.json({ case: result.case });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const current = await getCaseById(id);
  const error = await deleteCase(id);
  if (error) return NextResponse.json({ error }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/app/cases");
  if (current) {
    revalidatePath(`/cases/${current.slug}`);
    revalidatePath(`/cases/${current.id}`);
  }
  return NextResponse.json({ ok: true });
}
