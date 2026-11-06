import { demandPriorityRank } from "@/lib/demand-labels";
import { copyDemandFiles } from "@/lib/demand-files";
import { getFeedbackTypeById } from "@/lib/feedback-types";

export { canRequestCreative, canUploadCreatives } from "@/lib/demand-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateCreatorDemandValues,
  CreateFeedbackValues,
  CreatorDemandFields,
  DemandKind,
  DemandPriority,
  DemandStatus,
  RequestVariationValues,
  UpdateDemandValues,
  UpdateFeedbackValues,
} from "@/lib/validations/demand";
import type { Database } from "@/types/database.types";

type DemandRow = Database["public"]["Tables"]["demands"]["Row"];
type ClientJoin = { id: string; name: string; company: string; whatsapp: string | null } | null;
type ResponsibleJoin = { id: string; first_name: string | null; last_name: string | null } | null;
type FeedbackTypeJoin = { id: string; name: string } | { id: string; name: string }[] | null;
type DemandQueryRow = DemandRow & { client: ClientJoin; responsible: ResponsibleJoin; feedback_type: FeedbackTypeJoin };

export type DemandRecord = {
  id: string;
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientWhatsapp: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  kind: DemandKind;
  status: DemandStatus;
  priority: DemandPriority;
  dueOn: string | null;
  title: string | null;
  description: string;
  briefing: string | null;
  typeId: string | null;
  typeName: string | null;
  solution: string | null;
  sourceDemandId: string | null;
  variationNote: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackRecord = DemandRecord;

const demandSelect = "*, client:clients!demands_client_id_fkey(id, name, company, whatsapp), responsible:profiles!demands_responsible_id_fkey(id, first_name, last_name), feedback_type:feedback_types!demands_feedback_type_id_fkey(id, name)";

function profileName(profile: ResponsibleJoin) {
  if (!profile) return null;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

function asDemandKind(value: string): DemandKind {
  if (value === "midia") return "midia";
  if (value === "creator") return "creator";
  return "feedback";
}

function asDemandStatus(value: string): DemandStatus {
  if (value === "briefing" || value === "in_progress" || value === "completed") return value;
  return "new";
}

function asDemandPriority(value: string): DemandPriority {
  if (value === "high" || value === "low") return value;
  return "medium";
}

function mapDemand(row: DemandQueryRow): DemandRecord {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client?.name || "Cliente removido",
    clientCompany: row.client?.company || "",
    clientWhatsapp: row.client?.whatsapp || null,
    responsibleId: row.responsible_id,
    responsibleName: profileName(row.responsible),
    kind: asDemandKind(row.kind),
    status: asDemandStatus(row.status),
    priority: asDemandPriority(row.priority),
    dueOn: row.due_on,
    title: row.title,
    description: row.description,
    briefing: row.briefing,
    typeId: row.feedback_type_id,
    typeName: (Array.isArray(row.feedback_type) ? row.feedback_type[0] : row.feedback_type)?.name || null,
    solution: row.solution,
    sourceDemandId: row.source_demand_id,
    variationNote: row.variation_note,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortDemands(records: DemandRecord[]) {
  return [...records].sort((left, right) => {
    const priority = demandPriorityRank(left.priority) - demandPriorityRank(right.priority);
    if (priority !== 0) return priority;
    if (left.dueOn && right.dueOn && left.dueOn !== right.dueOn) return left.dueOn.localeCompare(right.dueOn);
    if (left.dueOn && !right.dueOn) return -1;
    if (!left.dueOn && right.dueOn) return 1;
    return right.createdAt.localeCompare(left.createdAt);
  });
}

function dueOnValue(value?: string) {
  return value?.trim() || null;
}

export const creatorAlreadyLinkedError = "Já existe uma demanda de criativo para este feedback.";

async function assertCreator(creatorId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, role").eq("id", creatorId).maybeSingle();
  return data?.role === "creator";
}

async function creatorSourceTaken(sourceId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demands")
    .select("id")
    .eq("kind", "creator")
    .eq("source_demand_id", sourceId)
    .limit(1);
  if (error) return false;
  return (data?.length ?? 0) > 0;
}

async function removeDemand(id: string) {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("demands").delete().eq("id", id);
    return error?.message ?? null;
  } catch (err) {
    return err instanceof Error ? err.message : "Não foi possível desfazer a demanda.";
  }
}

async function insertCreatorDemand(values: CreateCreatorDemandValues, userId: string) {
  if (!(await assertCreator(values.creatorId))) {
    return { demand: null, error: "Selecione um creator válido." };
  }

  const supabase = await createClient();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", values.clientId)
    .maybeSingle();
  if (clientError || !client) return { demand: null, error: "Cliente não encontrado." };

  if (values.sourceDemandId && await creatorSourceTaken(values.sourceDemandId)) {
    return { demand: null, error: creatorAlreadyLinkedError };
  }

  const { data, error } = await supabase
    .from("demands")
    .insert({
      client_id: client.id,
      responsible_id: values.creatorId,
      kind: "creator",
      status: "new",
      title: values.title.trim(),
      description: values.description?.trim() || "",
      briefing: values.briefing.trim(),
      source_demand_id: values.sourceDemandId || null,
      created_by: userId,
    })
    .select(demandSelect)
    .single();
  if (error || !data) {
    if (error?.code === "23505" && values.sourceDemandId) {
      return { demand: null, error: creatorAlreadyLinkedError };
    }
    return { demand: null, error: error?.message || "Não foi possível cadastrar a demanda." };
  }

  const demand = mapDemand(data as DemandQueryRow);
  if (values.referenceFileIds?.length) {
    try {
      const copied = await copyDemandFiles(values.referenceFileIds, demand.id, userId);
      if (copied.error) {
        const rollbackError = await removeDemand(demand.id);
        return { demand: rollbackError ? demand : null, error: copied.error };
      }
    } catch (err) {
      const rollbackError = await removeDemand(demand.id);
      const message = err instanceof Error ? err.message : "Não foi possível copiar as referências.";
      return { demand: rollbackError ? demand : null, error: message };
    }
  }
  return { demand, error: null };
}

export async function listDemands(): Promise<DemandRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("demands").select(demandSelect);
  if (error || !data) return [];
  return sortDemands(data.map((row) => mapDemand(row as DemandQueryRow)));
}

export async function listFeedbacks(): Promise<FeedbackRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demands")
    .select(demandSelect)
    .eq("kind", "feedback")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => mapDemand(row as DemandQueryRow));
}

export async function getDemandById(id: string): Promise<DemandRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("demands").select(demandSelect).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapDemand(data as DemandQueryRow);
}

export async function getFeedbackById(id: string): Promise<FeedbackRecord | null> {
  const record = await getDemandById(id);
  if (!record || record.kind !== "feedback") return null;
  return record;
}

export async function createFeedback(values: CreateFeedbackValues) {
  const type = await getFeedbackTypeById(values.typeId);
  if (!type) return { feedback: null, creatorDemand: null, error: "Tipo de feedback não encontrado." };
  if (type.spawnsCreator && !values.creator) {
    return { feedback: null, creatorDemand: null, error: "Informe os dados da demanda de criativo." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { feedback: null, creatorDemand: null, error: "Não autenticado." };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, responsible_id")
    .eq("id", values.clientId)
    .maybeSingle();
  if (clientError || !client) return { feedback: null, creatorDemand: null, error: "Cliente não encontrado." };

  if (values.creator && !(await assertCreator(values.creator.creatorId))) {
    return { feedback: null, creatorDemand: null, error: "Selecione um creator válido." };
  }

  const { data, error } = await supabase
    .from("demands")
    .insert({
      client_id: client.id,
      responsible_id: client.responsible_id,
      kind: "feedback",
      status: "new",
      priority: values.priority || "medium",
      due_on: dueOnValue(values.dueOn),
      description: values.description.trim(),
      feedback_type_id: type.id,
      solution: type.solution,
      created_by: user.id,
    })
    .select(demandSelect)
    .single();
  if (error || !data) return { feedback: null, creatorDemand: null, error: error?.message || "Não foi possível cadastrar o feedback." };

  const feedback = mapDemand(data as DemandQueryRow);
  if (!type.spawnsCreator || !values.creator) return { feedback, creatorDemand: null, error: null };

  const created = await insertCreatorDemand({
    ...values.creator,
    clientId: client.id,
    sourceDemandId: feedback.id,
  }, user.id);
  if (created.error || !created.demand) {
    const creatorRollback = created.demand ? await removeDemand(created.demand.id) : null;
    const rollbackError = await removeDemand(feedback.id);
    const error = created.error || "Não foi possível criar a demanda de criativo.";
    if (rollbackError) {
      return {
        feedback,
        creatorDemand: creatorRollback ? created.demand : null,
        error: `${error} Não foi possível desfazer o feedback.`,
      };
    }
    return { feedback: null, creatorDemand: null, error };
  }
  return { feedback, creatorDemand: created.demand, error: null };
}

export async function createCreatorDemand(values: CreateCreatorDemandValues) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { demand: null, error: "Não autenticado." };
  return insertCreatorDemand(values, user.id);
}

export async function requestCreativeFromFeedback(sourceId: string, values: CreatorDemandFields) {
  const source = await getFeedbackById(sourceId);
  if (!source) return { demand: null, error: "Feedback não encontrado." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { demand: null, error: "Não autenticado." };

  return insertCreatorDemand({
    ...values,
    clientId: source.clientId,
    sourceDemandId: source.id,
  }, user.id);
}

export async function requestVariation(id: string, values: RequestVariationValues) {
  const current = await getDemandById(id);
  if (!current || current.kind !== "creator") return { demand: null, error: "Demanda de criativo não encontrada." };

  const patch: Database["public"]["Tables"]["demands"]["Update"] = {
    variation_note: values.note.trim(),
  };
  if (current.status === "completed") patch.status = "in_progress";

  const supabase = await createClient();
  const { data, error } = await supabase.from("demands").update(patch).eq("id", id).eq("kind", "creator").select(demandSelect).single();
  if (error || !data) return { demand: null, error: error?.message || "Não foi possível solicitar a variação." };
  return { demand: mapDemand(data as DemandQueryRow), error: null };
}

export async function updateFeedback(id: string, values: UpdateFeedbackValues) {
  const current = await getFeedbackById(id);
  if (!current) return { feedback: null, error: "Feedback não encontrado." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demands")
    .update({ description: values.description.trim() })
    .eq("id", id)
    .eq("kind", "feedback")
    .select(demandSelect)
    .single();
  if (error || !data) return { feedback: null, error: error?.message || "Não foi possível salvar o feedback." };
  return { feedback: mapDemand(data as DemandQueryRow), error: null };
}

export async function updateDemand(id: string, values: UpdateDemandValues) {
  const current = await getDemandById(id);
  if (!current) return { demand: null, error: "Demanda não encontrada." };

  const patch: Database["public"]["Tables"]["demands"]["Update"] = {};
  if (values.description !== undefined) patch.description = values.description.trim();
  if (values.status) patch.status = values.status;
  if (values.priority) patch.priority = values.priority;
  if (values.dueOn !== undefined) patch.due_on = dueOnValue(values.dueOn);

  const supabase = await createClient();
  const { data, error } = await supabase.from("demands").update(patch).eq("id", id).select(demandSelect).single();
  if (error || !data) return { demand: null, error: error?.message || "Não foi possível salvar a demanda." };
  return { demand: mapDemand(data as DemandQueryRow), error: null };
}

export async function deleteFeedback(id: string) {
  const current = await getFeedbackById(id);
  if (!current) return "Feedback não encontrado.";

  const supabase = await createClient();
  const { error } = await supabase.from("demands").delete().eq("id", id).eq("kind", "feedback");
  return error?.message ?? null;
}

export async function clientHasDemands(clientId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("demands")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);
  if (error) return false;
  return (count ?? 0) > 0;
}
