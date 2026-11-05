import { z } from "zod";

export const demandKinds = ["feedback", "midia", "creator"] as const;
export type DemandKind = (typeof demandKinds)[number];

export const demandStatuses = ["new", "briefing", "in_progress", "completed"] as const;
export type DemandStatus = (typeof demandStatuses)[number];

export const demandPriorities = ["low", "medium", "high"] as const;
export type DemandPriority = (typeof demandPriorities)[number];

export const demandFileKinds = ["reference", "creative"] as const;
export type DemandFileKind = (typeof demandFileKinds)[number];

const dueOnSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Prazo inválido."),
  z.literal(""),
]).optional();

export const creatorDemandFieldsSchema = z.object({
  title: z.string().trim().min(2, "Informe o nome da demanda."),
  creatorId: z.string().uuid("Selecione o creator."),
  briefing: z.string().trim().min(2, "Informe o briefing."),
  description: z.string().optional(),
  referenceFileIds: z.array(z.string().uuid()).optional(),
});

export const createFeedbackSchema = z.object({
  clientId: z.string().uuid("Cliente inválido."),
  typeId: z.string().uuid("Selecione o tipo."),
  description: z.string().trim().min(2, "Informe a descrição."),
  priority: z.enum(demandPriorities),
  dueOn: dueOnSchema,
  creator: creatorDemandFieldsSchema.optional(),
});

export const updateFeedbackSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição."),
});

export const createCreatorDemandSchema = creatorDemandFieldsSchema.extend({
  clientId: z.string().uuid("Cliente inválido."),
  sourceDemandId: z.string().uuid().optional(),
});

export const requestCreativeSchema = creatorDemandFieldsSchema;

export const requestVariationSchema = z.object({
  note: z.string().trim().min(2, "Descreva a variação."),
});

export const createDemandFileSchema = z.object({
  kind: z.enum(demandFileKinds),
  path: z.string().trim().min(3, "Arquivo inválido."),
  name: z.string().trim().min(1, "Informe o nome do arquivo."),
  mime: z.string().trim().min(3, "Tipo de arquivo inválido."),
});

export const updateDemandSchema = z.object({
  description: z.string().optional(),
  status: z.enum(demandStatuses).optional(),
  priority: z.enum(demandPriorities).optional(),
  dueOn: dueOnSchema,
}).refine((value) => value.description !== undefined || value.status || value.priority || value.dueOn !== undefined, {
  message: "Nada para atualizar.",
});

export type CreatorDemandFields = z.infer<typeof creatorDemandFieldsSchema>;
export type CreateFeedbackValues = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackValues = z.infer<typeof updateFeedbackSchema>;
export type CreateCreatorDemandValues = z.infer<typeof createCreatorDemandSchema>;
export type RequestCreativeValues = z.infer<typeof requestCreativeSchema>;
export type RequestVariationValues = z.infer<typeof requestVariationSchema>;
export type CreateDemandFileValues = z.infer<typeof createDemandFileSchema>;
export type UpdateDemandValues = z.infer<typeof updateDemandSchema>;
