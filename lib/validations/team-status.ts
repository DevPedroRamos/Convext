import { z } from "zod";
import { isTeamStatusIcon } from "@/lib/team-status-icons";

export const presenceSchema = z.object({
  available: z.boolean(),
});

export const ownStatusSchema = z.object({
  statusId: z.string().uuid().nullable(),
});

export const teamStatusSchema = z.object({
  name: z.string().min(2, "Informe o nome do status."),
  icon: z.string().refine(isTeamStatusIcon, "Ícone inválido."),
});

export type PresenceValues = z.infer<typeof presenceSchema>;
export type OwnStatusValues = z.infer<typeof ownStatusSchema>;
export type TeamStatusValues = z.infer<typeof teamStatusSchema>;
