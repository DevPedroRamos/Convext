import { NextResponse } from "next/server";
import { getCurrentUserProfile, hasPasswordSet, isOnboardingComplete } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { isPasswordSameAsEmail, onboardingSchema, passwordChangeSchema } from "@/lib/validations/profile";

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
  const needsPassword = !hasPasswordSet(user);
  if (needsPassword) {
    const passwords = passwordChangeSchema.safeParse({
      password: values.password ?? "",
      confirmPassword: values.confirmPassword ?? "",
    });
    if (!passwords.success) {
      return NextResponse.json({ error: "Defina uma senha com pelo menos 8 caracteres." }, { status: 400 });
    }
    if (isPasswordSameAsEmail(passwords.data.password, user.email)) {
      return NextResponse.json({ error: "Escolha uma senha diferente do e-mail." }, { status: 400 });
    }
  }

  const supabase = await createClient();
  if (needsPassword && values.password) {
    const { error: passwordError } = await supabase.auth.updateUser({
      password: values.password,
      data: { ...user.user_metadata, password_set: true },
    });
    if (passwordError) return NextResponse.json({ error: passwordError.message }, { status: 400 });
  }
  const { error: profileError } = await supabase.from("profiles").update({
    phone: values.phone,
    avatar_url: values.avatarUrl,
  }).eq("id", user.id);
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const { data: completed, error: completeError } = await supabase.rpc("complete_profile_onboarding");
  if (completeError) return NextResponse.json({ error: completeError.message }, { status: 500 });
  if (!completed) {
    return NextResponse.json({ error: "Preencha telefone e foto de perfil." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
