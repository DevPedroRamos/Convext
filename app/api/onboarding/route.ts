import { NextResponse } from "next/server";
import { getCurrentUserProfile, isOnboardingComplete } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/profile";

export async function POST(request: Request) {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (isOnboardingComplete(profile)) {
    return NextResponse.json({ error: "Onboarding já concluído." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const values = parsed.data;
  if (user.email && values.password.trim().toLowerCase() === user.email.trim().toLowerCase()) {
    return NextResponse.json({ error: "Escolha uma senha diferente do e-mail." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: passwordError } = await supabase.auth.updateUser({ password: values.password });
  if (passwordError) return NextResponse.json({ error: passwordError.message }, { status: 400 });

  const { error: profileError } = await supabase.from("profiles").update({
    first_name: values.firstName,
    last_name: values.lastName || null,
    phone: values.phone,
    avatar_url: values.avatarUrl,
  }).eq("id", user.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { data: completed, error: completeError } = await supabase.rpc("complete_profile_onboarding");
  if (completeError) return NextResponse.json({ error: completeError.message }, { status: 500 });
  if (!completed) {
    return NextResponse.json({ error: "Preencha nome, telefone e foto de perfil." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
