import { createClient } from "@/lib/supabase/server";
import type { FeedbackTypeValues } from "@/lib/validations/feedback-type";

export type FeedbackType = {
  id: string;
  name: string;
  solution: string;
  spawnsCreator: boolean;
  sortOrder: number;
};

function mapType(row: { id: string; name: string; solution: string; spawns_creator: boolean; sort_order: number }): FeedbackType {
  return {
    id: row.id,
    name: row.name,
    solution: row.solution,
    spawnsCreator: row.spawns_creator,
    sortOrder: row.sort_order,
  };
}

export async function listFeedbackTypes(): Promise<FeedbackType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_types")
    .select("id, name, solution, spawns_creator, sort_order")
    .order("sort_order")
    .order("name");
  if (error || !data) return [];
  return data.map(mapType);
}

export async function getFeedbackTypeById(id: string): Promise<FeedbackType | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_types")
    .select("id, name, solution, spawns_creator, sort_order")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return mapType(data);
}

export async function createFeedbackType(values: FeedbackTypeValues) {
  const supabase = await createClient();
  const { count } = await supabase.from("feedback_types").select("id", { count: "exact", head: true });
  const { data, error } = await supabase
    .from("feedback_types")
    .insert({
      name: values.name.trim(),
      solution: values.solution?.trim() || "",
      spawns_creator: Boolean(values.spawnsCreator),
      sort_order: count ?? 0,
    })
    .select("id, name, solution, spawns_creator, sort_order")
    .single();
  if (error || !data) return { type: null, error: error?.message || "Não foi possível criar o tipo." };
  return { type: mapType(data), error: null };
}

export async function updateFeedbackType(id: string, values: FeedbackTypeValues) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_types")
    .update({
      name: values.name.trim(),
      solution: values.solution?.trim() || "",
      spawns_creator: Boolean(values.spawnsCreator),
    })
    .eq("id", id)
    .select("id, name, solution, spawns_creator, sort_order")
    .single();
  if (error || !data) return { type: null, error: error?.message || "Não foi possível salvar o tipo." };
  return { type: mapType(data), error: null };
}

export async function deleteFeedbackType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("feedback_types").delete().eq("id", id);
  return error?.message ?? null;
}
