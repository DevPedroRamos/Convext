// Espelho das regras do banco (supabase/migrations/*_spaces.sql) para a interface decidir
// o que mostrar. Quem decide de fato são as funções space_* no banco.
import type { AppRole } from "@/lib/access";
import { parseGallery } from "@/lib/spaces/gallery";
import type { FormField, Space, SpaceStage, SpaceTask } from "@/lib/spaces/types";
import type { AppointmentInput } from "@/lib/validations/spaces";

export type Viewer = { id: string; role: AppRole };

export function orderedStages(space: Pick<Space, "stages">) {
  return [...space.stages].sort((a, b) => a.position - b.position);
}

export function nextStage(space: Pick<Space, "stages">, stageId: string): SpaceStage | null {
  const stages = orderedStages(space);
  const index = stages.findIndex((stage) => stage.id === stageId);
  return index >= 0 ? (stages[index + 1] ?? null) : null;
}

export function rejectTarget(space: Pick<Space, "stages">, stage: SpaceStage): SpaceStage | null {
  const stages = orderedStages(space);
  const explicit = stage.rejectTo ? stages.find((item) => item.id === stage.rejectTo) : null;
  if (explicit) return explicit;
  const index = stages.findIndex((item) => item.id === stage.id);
  return index > 0 ? stages[index - 1] : null;
}

export function canSeeSpace(space: Pick<Space, "memberRoles">, viewer: Viewer) {
  return viewer.role === "admin" || space.memberRoles.includes(viewer.role);
}

export function canAct(task: Pick<SpaceTask, "createdBy" | "assigneeId">, stage: SpaceStage, viewer: Viewer) {
  if (stage.type === "done") return false;
  if (viewer.role === "admin") return true;
  if (stage.ownerRole === "requester") return task.createdBy === viewer.id;
  if (task.assigneeId) return task.assigneeId === viewer.id;
  return stage.ownerRole === viewer.role;
}

/**
 * "Sua vez": tarefas que esperam por esta pessoa. O admin pode agir em tudo, mas a vez dele
 * são só as etapas de dono admin ou as que pegou para si.
 */
export function isMyTurn(task: Pick<SpaceTask, "createdBy" | "assigneeId">, stage: SpaceStage, viewer: Viewer) {
  if (viewer.role !== "admin") return canAct(task, stage, viewer);
  return stage.type !== "done" && (task.assigneeId === viewer.id || (!task.assigneeId && stage.ownerRole === "admin"));
}

export function canClaim(task: Pick<SpaceTask, "assigneeId">, stage: SpaceStage, viewer: Viewer) {
  return stage.type !== "done" && stage.ownerRole !== "requester" && !task.assigneeId && (viewer.role === stage.ownerRole || viewer.role === "admin");
}

/** Falta preencher a informação exigida para concluir a etapa? */
export function missingRequirement(task: Pick<SpaceTask, "values">, stage: SpaceStage) {
  const label = stage.requiresLabel?.trim();
  if (!label) return null;
  return task.values[label]?.trim() ? null : label;
}

export function canSubmitForm(form: { audienceRoles: AppRole[]; active: boolean }, role: AppRole) {
  return form.active && (role === "admin" || form.audienceRoles.includes(role));
}

export function selectOptions(field: Pick<FormField, "options">) {
  return (field.options ?? "").split(",").map((option) => option.trim()).filter(Boolean);
}

/** Valida os valores de um envio: devolve o primeiro rótulo obrigatório vazio. */
export function firstMissingField(fields: FormField[], values: Record<string, string>, clientId: string | null, appointment?: AppointmentInput | null) {
  for (const field of fields) {
    if (!field.required) continue;
    if (field.type === "client") {
      if (!clientId) return field.label;
    } else if (field.type === "gallery") {
      if (!parseGallery(values[field.key]).length) return field.label;
    } else if (field.type === "appointment") {
      if (!appointment?.startsAt || !appointment.attendeeIds.length) return field.label;
    } else if (!values[field.key]?.trim()) {
      return field.label;
    }
  }
  return null;
}

export function canReschedule(role: AppRole) {
  return role === "admin" || role === "coordinator";
}

/** Problemas na configuração de um fluxo antes de salvar. */
export function flowProblems(stages: Pick<SpaceStage, "name" | "type" | "ownerRole">[]) {
  const problems: string[] = [];
  if (stages.length < 2) problems.push("O fluxo precisa de pelo menos duas etapas.");
  if (stages.some((stage) => !stage.name.trim())) problems.push("Toda etapa precisa de nome.");
  if (stages.some((stage) => stage.type !== "done" && !stage.ownerRole)) problems.push("Toda etapa que não é a final precisa de um dono.");
  if (stages.length && stages[stages.length - 1].type !== "done") problems.push("A última etapa precisa ser do tipo Concluída.");
  if (stages.slice(0, -1).some((stage) => stage.type === "done")) problems.push("Só a última etapa pode ser do tipo Concluída.");
  if (stages[0]?.type === "approval") problems.push("A primeira etapa não pode ser de aprovação.");
  return problems;
}
