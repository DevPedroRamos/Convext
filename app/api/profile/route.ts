import { NextResponse } from "next/server";
import { requireOnboardedUser } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validations/profile";

export async function GET() {
  const { user, response } = await requireOnboardedUser();
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireOnboardedUser();
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const values = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").update({
    first_name: values.firstName,
    last_name: values.lastName || null,
    phone: values.phone || null,
    company: values.company || null,
    avatar_url: values.avatarUrl || null,
  }).eq("id", user.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
