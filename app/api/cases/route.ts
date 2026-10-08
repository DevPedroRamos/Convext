import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createCase, listAllCases } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";
import { caseSchema } from "@/lib/validations/case";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const cases = await listAllCases();
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = caseSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const result = await createCase(parsed.data);
  if (result.error || !result.case) return NextResponse.json({ error: result.error }, { status: 500 });
  revalidatePath("/");
  revalidatePath("/app/cases");
  revalidatePath(`/cases/${result.case.slug}`);
  revalidatePath(`/cases/${result.case.id}`);
  return NextResponse.json({ case: result.case }, { status: 201 });
}
