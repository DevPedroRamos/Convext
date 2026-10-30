import { clientHasDemands } from "@/lib/demands";
import { createClient } from "@/lib/supabase/server";
import type { ClientValues } from "@/lib/validations/client";
import type { Database } from "@/types/database.types";

type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type ResponsibleJoin = { id: string; first_name: string | null; last_name: string | null } | null;
type ClientQueryRow = ClientRow & { responsible: ResponsibleJoin };

export type ClientRecord = {
  id: string;
  name: string;
  company: string;
  whatsapp: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  createdAt: string;
  updatedAt: string;
};

const clientSelect = "*, responsible:profiles!clients_responsible_id_fkey(id, first_name, last_name)";

function responsibleName(profile: ResponsibleJoin) {
  if (!profile) return null;
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

function mapClient(row: ClientQueryRow): ClientRecord {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    whatsapp: row.whatsapp,
    responsibleId: row.responsible_id,
    responsibleName: responsibleName(row.responsible),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toClientRow(values: ClientValues) {
  return {
    name: values.name.trim(),
    company: values.company.trim(),
    whatsapp: values.whatsapp?.trim() || null,
    responsible_id: values.responsibleId || null,
  };
}

export async function listClients(): Promise<ClientRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select(clientSelect)
    .order("name", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => mapClient(row as ClientQueryRow));
}

export async function getClientById(id: string): Promise<ClientRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").select(clientSelect).eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapClient(data as ClientQueryRow);
}

export async function createClientRecord(values: ClientValues) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").insert(toClientRow(values)).select(clientSelect).single();
  if (error || !data) return { client: null, error: error?.message || "Não foi possível cadastrar o cliente." };
  return { client: mapClient(data as ClientQueryRow), error: null };
}

export async function updateClient(id: string, values: ClientValues) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").update(toClientRow(values)).eq("id", id).select(clientSelect).single();
  if (error || !data) return { client: null, error: error?.message || "Não foi possível salvar o cliente." };
  return { client: mapClient(data as ClientQueryRow), error: null };
}

export async function deleteClient(id: string) {
  if (await clientHasDemands(id)) return "Este cliente tem demandas e não pode ser excluído.";
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (!error) return null;
  if (error.code === "23503") return "Este cliente tem demandas e não pode ser excluído.";
  return error.message;
}
