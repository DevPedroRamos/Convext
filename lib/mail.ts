import { Resend } from "resend";
import { hasResendEnv } from "@/lib/env";

export async function sendEmployeeInvite(input: { userId: string; email: string; firstName: string; inviteUrl: string }) {
  if (!hasResendEnv()) {
    return { error: "O envio de e-mail não está configurado." };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send(
    {
      from: process.env.RESEND_FROM_EMAIL!,
      to: input.email,
      subject: "Convite para a Convext",
      html: inviteHtml(input.firstName, input.inviteUrl),
      text: `Olá, ${input.firstName}. Você foi convidado para acessar a área da Convext. Confirme seus dados e crie sua senha: ${input.inviteUrl}`,
    },
    { idempotencyKey: `convite/${input.userId}` },
  );

  if (!error) return { error: null };
  return { error: error.message || "Não foi possível enviar o convite." };
}

function inviteHtml(firstName: string, inviteUrl: string) {
  const safeName = escapeHtml(firstName);
  const safeUrl = escapeHtml(inviteUrl);
  return `<!doctype html>
<html>
  <body style="background:#0f0f0f;color:#fcfcfc;font-family:Arial,sans-serif;margin:0;padding:24px;">
    <div style="margin:0 auto;padding:32px;background:#151515;border-radius:20px;max-width:560px;">
      <h1 style="color:#f35703;font-size:32px;margin:0 0 16px;">Convite para a Convext</h1>
      <p>Olá, ${safeName}.</p>
      <p>Você foi convidado para acessar a área da Convext. Confirme seus dados e crie sua senha para entrar.</p>
      <p><a href="${safeUrl}" style="background:#f35703;color:#ffffff;border-radius:12px;display:inline-block;font-size:14px;font-weight:600;padding:12px 20px;text-decoration:none;">Confirmar acesso</a></p>
      <p style="color:#898989;">Se você não esperava este convite, ignore este e-mail.</p>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
