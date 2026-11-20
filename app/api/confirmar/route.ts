import { NextResponse } from "next/server";
import { getCurrentUserProfile, hasPasswordSet, isOnboardingComplete } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";
import { inviteConfirmSchema, isPasswordSameAsEmail } from "@/lib/validations/profile";

export async function POST(request: Request) {
  const { user, profile } = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (isOnboardingComplete(profile) || hasPasswordSet(user)) {
    return NextResponse.json({ error: "A senha já foi definida." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = inviteConfirmSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  const values = parsed.data;
  if (isPasswordSameAsEmail(values.password, user.email)) {
    return NextResponse.json({ error: "Escolha uma senha diferente do e-mail." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error: passwordError } = await supabase.auth.updateUser({
    password: values.password,
    data: { ...user.user_metadata, password_set: true },
  });
  if (passwordError) return NextResponse.json({ error: passwordError.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
