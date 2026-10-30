import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do cliente."),
  company: z.string().trim().min(2, "Informe a empresa."),
  whatsapp: z.string().trim().optional().or(z.literal("")),
  responsibleId: z.string().uuid("Responsável inválido.").optional().or(z.literal("")),
});

export type ClientValues = z.infer<typeof clientSchema>;
