import type { DemandKind, DemandStatus } from "@/lib/validations/demand";

type DemandAccess = {
  kind: DemandKind;
  status: DemandStatus;
  responsibleId: string | null;
  variationNote: string | null;
};

export function canUploadCreatives(demand: DemandAccess, userId?: string | null) {
  return demand.kind === "creator"
    && Boolean(userId)
    && demand.responsibleId === userId
    && (demand.status === "completed" || Boolean(demand.variationNote));
}

export function canRequestCreative(demand: Pick<DemandAccess, "kind" | "responsibleId">, userId?: string | null, isOps = false) {
  return demand.kind === "feedback" && (isOps || Boolean(userId && demand.responsibleId === userId));
}
