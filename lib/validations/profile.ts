import { z } from "zod";

export const profileSchema = z.object({
  firstName: z.string().min(2, "Informe seu nome."),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});

export const passwordChangeSchema = z.object({
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  confirmPassword: z.string().min(8, "Confirme a senha."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "As senhas precisam ser iguais.",
  path: ["confirmPassword"],
});

export const inviteConfirmSchema = passwordChangeSchema;

export function isPasswordSameAsEmail(password: string, email?: string | null) {
  return Boolean(email && password.trim().toLowerCase() === email.trim().toLowerCase());
}

export const onboardingSchema = profileSchema.extend({
  phone: z.string().min(8, "Informe seu telefone."),
  avatarUrl: z.string().url("Envie sua foto de perfil."),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type InviteConfirmValues = z.infer<typeof inviteConfirmSchema>;
