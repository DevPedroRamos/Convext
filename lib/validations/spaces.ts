import { z } from "zod";
import { FIELD_TYPES } from "@/lib/spaces/types";

const role = z.enum(["admin", "coordinator", "traffic", "creator", "commercial"]);
const roles = z.array(role).min(1, "Escolha ao menos uma role.");
const uuid = z.string().uuid();

export const appointmentInputSchema = z.object({
  startsAt: z.string().datetime({ offset: true, message: "Informe a data e a hora de início." }),
  durationMinutes: z.number().int().min(15).max(720).default(60),
  location: z.string().trim().max(200).default(""),
  attendeeIds: z.array(uuid).min(1, "Escolha ao menos um participante."),
});
export type AppointmentInput = z.infer<typeof appointmentInputSchema>;

export const createTaskSchema = z.object({
  formId: uuid,
  title: z.string().trim().min(2, "Informe o título."),
  clientId: uuid.nullable().optional(),
  values: z.record(z.string(), z.string().max(20000)).default({}),
  appointment: appointmentInputSchema.optional().nullable(),
});

export const taskActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("advance"), value: z.string().trim().max(2000).optional() }),
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3, "Escreva o motivo da recusa.") }),
  z.object({ action: z.literal("claim") }),
  z.object({ action: z.literal("move"), stageId: uuid }),
  z.object({ action: z.literal("comment"), message: z.string().trim().min(1, "Escreva o comentário.").max(4000) }),
  z.object({ action: z.literal("reschedule"), appointment: appointmentInputSchema }),
  z.object({ action: z.literal("unschedule") }),
]);

export const stageSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Toda etapa precisa de nome."),
  type: z.enum(["normal", "approval", "done"]),
  ownerRole: z.enum(["admin", "coordinator", "traffic", "creator", "commercial", "requester"]).nullable(),
  requiresLabel: z.string().trim().max(80).nullable().optional(),
  notify: z.boolean(),
  /** id (existente) ou índice "#n" (etapa nova na mesma lista). */
  rejectTo: z.string().nullable().optional(),
});

export const spaceSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do espaço."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida."),
  memberRoles: roles,
  stages: z.array(stageSchema).min(2, "O fluxo precisa de pelo menos duas etapas."),
});
export type SpaceValues = z.infer<typeof spaceSchema>;

export const formFieldSchema = z.object({
  key: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1, "Todo campo precisa de rótulo.").max(80),
  type: z.enum(FIELD_TYPES),
  required: z.boolean(),
  options: z.string().max(1000).optional(),
});

export const spaceFormSchema = z
  .object({
    spaceId: uuid,
    name: z.string().trim().min(2, "Informe o nome do formulário."),
    description: z.string().trim().max(300).optional().or(z.literal("")),
    audienceRoles: roles,
    active: z.boolean(),
    fields: z.array(formFieldSchema).min(1),
  })
  .refine((form) => form.fields.some((field) => field.key === "titulo"), { path: ["fields"], message: "O formulário precisa do campo de título." })
  .refine((form) => new Set(form.fields.map((field) => field.key)).size === form.fields.length, { path: ["fields"], message: "Campos repetidos." })
  .refine((form) => form.fields.filter((field) => field.type === "client").length <= 1, { path: ["fields"], message: "Use no máximo um campo de cliente." })
  .refine((form) => form.fields.filter((field) => field.type === "feedback").length <= 1, { path: ["fields"], message: "Use no máximo um campo de tipo de feedback." })
  .refine((form) => form.fields.filter((field) => field.type === "appointment").length <= 1, { path: ["fields"], message: "Use no máximo um campo de compromisso." });
export type SpaceFormValues = z.infer<typeof spaceFormSchema>;

export const quickActionsSchema = z.object({
  actions: z.array(
    z.object({
      id: z.string().optional(),
      label: z.string().trim().min(2),
      kind: z.enum(["form", "system"]),
      formId: uuid.nullable().optional(),
      systemAction: z.enum(["case", "client", "lead"]).nullable().optional(),
      audienceRoles: z.array(role),
    }),
  ),
});
