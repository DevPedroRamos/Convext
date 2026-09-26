import { NextResponse } from "next/server";
import { Resend } from "resend";
import { ContactConfirmationEmail } from "@/emails/contact-confirmation";
import { ContactNotificationEmail } from "@/emails/contact-notification";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasResendEnv, hasServerSupabaseEnv } from "@/lib/env";
import { contactSchema } from "@/lib/validations/contact";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos.", issues: parsed.error.flatten() }, { status: 400 });
  if (!hasServerSupabaseEnv()) return NextResponse.json({ error: "Supabase server env vars não configuradas." }, { status: 503 });

  const values = parsed.data;
  const supabase = createAdminClient();
  const { error } = await supabase.from("contacts").insert({
    first_name: values.firstName,
    last_name: values.lastName,
    email: values.email,
    phone: values.phone || null,
    company: values.company || null,
    website: values.website || null,
    inquiry_type: values.inquiryType,
    message: values.message,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let emailSent = false;
  if (hasResendEnv()) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.RESEND_FROM_EMAIL!;
    const to = process.env.CONVEXT_CONTACT_EMAIL || process.env.RESEND_FROM_EMAIL!;
    const [internal, confirmation] = await Promise.allSettled([
      resend.emails.send({ from, to, subject: "Novo contato pelo site — Convext", react: ContactNotificationEmail({ contact: values }) }),
      resend.emails.send({ from, to: values.email, subject: "Recebemos sua mensagem.", react: ContactConfirmationEmail({ firstName: values.firstName }) }),
    ]);
    emailSent = internal.status === "fulfilled" && confirmation.status === "fulfilled";
  }

  return NextResponse.json({ ok: true, emailSent });
}
