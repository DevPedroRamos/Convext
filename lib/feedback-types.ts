import { createClient } from "@/lib/supabase/server";

export type FeedbackType = {
  id: string;
  name: string;
  solution: string;
  sortOrder: number;
};

type FeedbackTypeRow = { id: string; name: string; solution: string; sort_order: number };

function mapType(row: FeedbackTypeRow): FeedbackType {
  return {
    id: row.id,
    name: row.name,
    solution: row.solution ?? "",
    sortOrder: row.sort_order,
  };
}

async function typesTable() {
  const supabase = await createClient();
  return (supabase as unknown as { from: (name: string) => FeedbackTypesQuery }).from("feedback_types");
}

type FeedbackTypesQuery = {
  select: (columns: string, options?: { count?: "exact"; head?: boolean }) => FeedbackTypesQuery;
  order: (column: string) => FeedbackTypesQuery;
  insert: (values: object) => FeedbackTypesQuery;
  update: (values: object) => FeedbackTypesQuery;
  delete: () => FeedbackTypesQuery;
  eq: (column: string, value: string) => FeedbackTypesQuery;
  single: () => Promise<{ data: FeedbackTypeRow | null; error: { message: string } | null }>;
  then: Promise<{ data: FeedbackTypeRow[] | null; count: number | null; error: { message: string } | null }>["then"];
};

export async function listFeedbackTypes(): Promise<FeedbackType[]> {
  const { data, error } = await (await typesTable()).select("id, name, solution, sort_order").order("sort_order").order("name");
  if (error || !data) return [];
  return data.map(mapType);
}

export async function createFeedbackType(values: { name: string; solution: string }) {
  const counted = await (await typesTable()).select("id", { count: "exact", head: true });
  const { data, error } = await (await typesTable())
    .insert({ name: values.name.trim(), solution: values.solution.trim(), sort_order: counted.count ?? 0 })
    .select("id, name, solution, sort_order")
    .single();
  if (error || !data) return { type: null, error: error?.message || "Não foi possível criar o tipo." };
  return { type: mapType(data), error: null };
}

export async function updateFeedbackType(id: string, values: { name: string; solution: string }) {
  const { data, error } = await (await typesTable())
    .update({ name: values.name.trim(), solution: values.solution.trim() })
    .eq("id", id)
    .select("id, name, solution, sort_order")
    .single();
  if (error || !data) return { type: null, error: error?.message || "Não foi possível salvar o tipo." };
  return { type: mapType(data), error: null };
}

export async function deleteFeedbackType(id: string) {
  const { error } = await (await typesTable()).delete().eq("id", id);
  return error?.message ?? null;
}
