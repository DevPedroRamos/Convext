import { z } from "zod";

export const diagnosticSchema = z.object({
  source: z.literal("diagnostico"),
  name: z.string().trim().min(3, "Informe seu nome completo."),
  whatsapp: z.string().trim().min(10, "Informe um WhatsApp com DDD."),
  email: z.string().trim().email("Informe um e-mail válido."),
  company: z.string().trim().min(2, "Informe a empresa."),
  challenge: z.string().min(1, "Escolha o desafio prioritário."),
  budget: z.string().optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "Precisamos do seu aceite para entrar em contato." }) }),
});

export type DiagnosticValues = z.infer<typeof diagnosticSchema>;
