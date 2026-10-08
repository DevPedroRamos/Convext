import { z } from "zod";

export const heroLeadSchema = z.object({
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Informe um e-mail válido."),
  whatsapp: z.string().min(10, "Informe um WhatsApp válido."),
  company: z.string().optional(),
});

export type HeroLeadValues = z.infer<typeof heroLeadSchema>;
