import { mapCase, placeholderCases, slugify, toCaseRow, type CaseRecord } from "@/lib/case-model";
import { createClient } from "@/lib/supabase/server";
import type { CaseValues } from "@/lib/validations/case";

export type { CaseRecord } from "@/lib/case-model";
export { slugify, videoEmbedSrc } from "@/lib/case-model";

async function uniqueSlug(base: string, ignoreId?: string) {
  const supabase = await createClient();
  let candidate = slugify(base);
  for (let index = 0; index < 12; index += 1) {
    const { data } = await supabase.from("cases").select("id").eq("slug", candidate).maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
    candidate = `${slugify(base)}-${index + 2}`;
  }
  return `${slugify(base)}-${crypto.randomUUID().slice(0, 6)}`;
}

export async function listPublishedCases(): Promise<CaseRecord[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return placeholderCases();
    return (data ?? []).map(mapCase);
  } catch {
    return placeholderCases();
  }
}

export async function listAllCases(): Promise<CaseRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapCase);
}

export async function getCaseById(id: string): Promise<CaseRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("cases").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapCase(data);
}

export async function getPublishedCase(idOrSlug: string) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data) return { current: null, prev: null, next: null };
    const cases = data.map(mapCase);
    const current = cases.find((item) => item.id === idOrSlug || item.slug === idOrSlug) ?? null;
    if (!current) return { current: null, prev: null, next: null };
    const index = cases.findIndex((item) => item.id === current.id);
    return {
      current,
      prev: index > 0 ? cases[index - 1] : null,
      next: index >= 0 && index < cases.length - 1 ? cases[index + 1] : null,
    };
  } catch {
    return { current: null, prev: null, next: null };
  }
}

export async function createCase(values: CaseValues) {
  const supabase = await createClient();
  const slug = await uniqueSlug(values.name);
  const { data, error } = await supabase.from("cases").insert(toCaseRow(values, slug)).select("*").single();
  if (error || !data) return { case: null, error: error?.message || "Não foi possível criar o case." };
  return { case: mapCase(data), error: null };
}

export async function updateCase(id: string, values: CaseValues) {
  const current = await getCaseById(id);
  const slug =
    current && slugify(values.name) === slugify(current.name)
      ? current.slug
      : await uniqueSlug(values.name, id);
  const supabase = await createClient();
  const { data, error } = await supabase.from("cases").update(toCaseRow(values, slug)).eq("id", id).select("*").single();
  if (error || !data) return { case: null, error: error?.message || "Não foi possível salvar o case." };
  return { case: mapCase(data), error: null };
}

export async function deleteCase(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cases").delete().eq("id", id);
  return error?.message ?? null;
}
