import type { DemandKind, DemandPriority, DemandStatus } from "@/lib/validations/demand";

export function demandKindLabel(kind: DemandKind) {
  if (kind === "midia") return "Mídia";
  if (kind === "creator") return "Criativo";
  return "Feedback";
}

export function demandStatusLabel(status: DemandStatus) {
  if (status === "briefing") return "Briefing";
  if (status === "in_progress") return "Em progresso";
  if (status === "completed") return "Concluído";
  return "Novo";
}

export function demandPriorityLabel(priority: DemandPriority) {
  if (priority === "high") return "Alta";
  if (priority === "low") return "Baixa";
  return "Média";
}

export function demandPriorityRank(priority: DemandPriority) {
  if (priority === "high") return 0;
  if (priority === "medium") return 1;
  return 2;
}

export function formatDueOn(value: string | null | undefined, empty = "—") {
  const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value || empty;
  return `${match[3]}/${match[2]}/${match[1]}`;
}
