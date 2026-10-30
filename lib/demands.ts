import { demandPriorityRank } from "@/lib/demand-labels";
import { createClient } from "@/lib/supabase/server";
import type {
  CreateFeedbackValues,
  DemandKind,
  DemandPriority,
  DemandStatus,
  UpdateDemandValues,
  UpdateFeedbackValues,
} from "@/lib/validations/demand";
import type { Database } from "@/types/database.types";

type DemandRow = Database["public"]["Tables"]["demands"]["Row"];
type ClientJoin = { id: string; name: string; company: string; whatsapp: string | null } | null;
type ResponsibleJoin = { id: string; first_name: string | null; last_name: string | null } | null;
type DemandQueryRow = DemandRow & { client: ClientJoin; responsible: ResponsibleJoin };

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
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackRecord = DemandRecord;

const demandSelect = "*, client:clients!demands_client_id_fkey(id, name, company, whatsapp), responsible:profiles!demands_responsible_id_fkey(id, first_name, last_name)";

function profileName(profile: ResponsibleJoin) {
  if (!profile) return null;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

function asDemandKind(value: string): DemandKind {
  return value === "midia" ? "midia" : "feedback";
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
    description: row.description,
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { feedback: null, error: "Não autenticado." };

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, responsible_id")
    .eq("id", values.clientId)
    .maybeSingle();
  if (clientError || !client) return { feedback: null, error: "Cliente não encontrado." };

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
      created_by: user.id,
    })
    .select(demandSelect)
    .single();
  if (error || !data) return { feedback: null, error: error?.message || "Não foi possível cadastrar o feedback." };
  return { feedback: mapDemand(data as DemandQueryRow), error: null };
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
  if (values.description) patch.description = values.description.trim();
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
