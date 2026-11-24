import type { AppRole } from "@/lib/access";
import type { StageOwner } from "@/lib/spaces/roles";

export type StageType = "normal" | "approval" | "done";

export type SpaceStage = {
  id: string;
  spaceId: string;
  name: string;
  position: number;
  type: StageType;
  ownerRole: StageOwner | null;
  requiresLabel: string | null;
  notify: boolean;
  rejectTo: string | null;
};

export type Space = {
  id: string;
  name: string;
  color: string;
  memberRoles: AppRole[];
  position: number;
  stages: SpaceStage[];
};

export const FIELD_TYPES = ["text", "longtext", "number", "date", "select", "client", "link", "feedback", "gallery", "appointment"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string;
};

export type SpaceForm = {
  id: string;
  spaceId: string;
  name: string;
  description: string | null;
  audienceRoles: AppRole[];
  fields: FormField[];
  active: boolean;
  position: number;
};

export type QuickAction = {
  id: string;
  label: string;
  kind: "form" | "system";
  formId: string | null;
  systemAction: "case" | "client" | "lead" | null;
  audienceRoles: AppRole[];
  position: number;
};

export type TaskAppointment = {
  id: string;
  taskId: string;
  startsAt: string;
  endsAt: string;
  location: string;
  attendees: { id: string; name: string }[];
  spaceId?: string;
  spaceName?: string;
  spaceColor?: string;
  title?: string;
};

export type TaskEvent = {
  id: string;
  actorName: string | null;
  kind: "created" | "advanced" | "approved" | "rejected" | "claimed" | "moved" | "comment" | "scheduled" | "rescheduled" | "unscheduled";
  message: string;
  createdAt: string;
};

export type SpaceTask = {
  id: string;
  spaceId: string;
  formId: string | null;
  stageId: string;
  title: string;
  clientId: string | null;
  clientName: string | null;
  values: Record<string, string>;
  assigneeId: string | null;
  assigneeName: string | null;
  createdBy: string | null;
  createdByName: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  appointment: TaskAppointment | null;
};

export type AppNotification = {
  id: string;
  taskId: string | null;
  spaceId: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export const systemActionLabels: Record<NonNullable<QuickAction["systemAction"]>, string> = {
  case: "Novo case",
  client: "Novo cliente",
  lead: "Novo lead",
};
