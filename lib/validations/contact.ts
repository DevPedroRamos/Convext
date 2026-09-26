import { z } from "zod";

export const contactSchema = z.object({
  inquiryType: z.enum(["Novo projeto", "Orçamento", "Parcerias", "Outro"]),
  firstName: z.string().min(2, "Informe seu nome."),
  lastName: z.string().min(2, "Informe seu sobrenome."),
  email: z.string().email("Informe um e-mail válido."),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  message: z.string().min(12, "Conte um pouco mais sobre o projeto."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
