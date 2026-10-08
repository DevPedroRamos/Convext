import { z } from "zod";

const optionalUrl = z.string().url("URL inválida.").optional().or(z.literal(""));

export const caseIdentitySchema = z.object({
  url: z.string().url("Envie a imagem da identidade."),
  caption: z.string().max(160).optional().or(z.literal("")),
});

export const caseSchema = z.object({
  name: z.string().min(2, "Informe o nome do cliente."),
  segment: z.string().min(2, "Informe o segmento."),
  summary: z.string().min(8, "Escreva um resumo."),
  logoUrl: z.string().url("Envie o logo."),
  coverUrl: optionalUrl,
  concept: z.string().optional(),
  location: z.string().optional(),
  fronts: z.array(z.string().min(1)).max(12).default([]),
  videoUrl: optionalUrl,
  identities: z.array(caseIdentitySchema).max(4).default([]),
  published: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type CaseValues = z.infer<typeof caseSchema>;
export type CaseIdentity = z.infer<typeof caseIdentitySchema>;
