import { z } from "zod";

export const demandKinds = ["feedback", "midia"] as const;
export type DemandKind = (typeof demandKinds)[number];

export const demandStatuses = ["new", "briefing", "in_progress", "completed"] as const;
export type DemandStatus = (typeof demandStatuses)[number];

export const demandPriorities = ["low", "medium", "high"] as const;
export type DemandPriority = (typeof demandPriorities)[number];

const dueOnSchema = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Prazo inválido."),
  z.literal(""),
]).optional();

export const createFeedbackSchema = z.object({
  clientId: z.string().uuid("Cliente inválido."),
  description: z.string().trim().min(2, "Informe a descrição."),
  priority: z.enum(demandPriorities).default("medium"),
  dueOn: dueOnSchema,
});

export const updateFeedbackSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição."),
});

export const updateDemandSchema = z.object({
  description: z.string().trim().min(2, "Informe a descrição.").optional(),
  status: z.enum(demandStatuses).optional(),
  priority: z.enum(demandPriorities).optional(),
  dueOn: dueOnSchema,
}).refine((value) => value.description || value.status || value.priority || value.dueOn !== undefined, {
  message: "Nada para atualizar.",
});

export type CreateFeedbackValues = z.infer<typeof createFeedbackSchema>;
export type UpdateFeedbackValues = z.infer<typeof updateFeedbackSchema>;
export type UpdateDemandValues = z.infer<typeof updateDemandSchema>;
