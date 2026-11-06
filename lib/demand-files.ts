import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { CreateDemandFileValues, DemandFileKind } from "@/lib/validations/demand";

export type DemandFileRecord = {
  id: string;
  demandId: string;
  kind: DemandFileKind;
  path: string;
  name: string;
  mime: string;
  createdAt: string;
};

function asFileKind(value: string): DemandFileKind {
  return value === "creative" ? "creative" : "reference";
}

function mapFile(row: { id: string; demand_id: string; kind: string; path: string; name: string; mime: string; created_at: string }): DemandFileRecord {
  return {
    id: row.id,
    demandId: row.demand_id,
    kind: asFileKind(row.kind),
    path: row.path,
    name: row.name,
    mime: row.mime,
    createdAt: row.created_at,
  };
}

export async function listDemandFiles(demandId: string, kind?: DemandFileKind): Promise<DemandFileRecord[]> {
  const supabase = await createClient();
  let query = supabase.from("demand_files").select("id, demand_id, kind, path, name, mime, created_at").eq("demand_id", demandId).order("created_at");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapFile);
}

export async function getDemandFile(demandId: string, fileId: string): Promise<DemandFileRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_files")
    .select("id, demand_id, kind, path, name, mime, created_at")
    .eq("id", fileId)
    .eq("demand_id", demandId)
    .maybeSingle();
  if (error || !data) return null;
  return mapFile(data);
}

export async function createDemandFile(demandId: string, values: CreateDemandFileValues, userId: string) {
  if (!values.path.startsWith(`${demandId}/`)) {
    return { file: null, error: "Caminho do arquivo inválido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("demand_files")
    .insert({
      demand_id: demandId,
      kind: values.kind,
      path: values.path,
      name: values.name.trim(),
      mime: values.mime.trim(),
      created_by: userId,
    })
    .select("id, demand_id, kind, path, name, mime, created_at")
    .single();
  if (error || !data) return { file: null, error: error?.message || "Não foi possível anexar o arquivo." };
  return { file: mapFile(data), error: null };
}

function storageCopyName(name: string) {
  const cleaned = name.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
  return cleaned || "arquivo";
}

export async function copyDemandFiles(sourceIds: string[], targetDemandId: string, userId: string, kind: DemandFileKind = "reference") {
  if (sourceIds.length === 0) return { files: [] as DemandFileRecord[], error: null };
  const supabase = await createClient();
  const { data: source, error: sourceError } = await supabase
    .from("demand_files")
    .select("id, demand_id, kind, path, name, mime, created_at")
    .in("id", sourceIds)
    .eq("kind", kind);
  if (sourceError) return { files: [] as DemandFileRecord[], error: sourceError.message };
  if (!source?.length) return { files: [] as DemandFileRecord[], error: null };

  const bucket = createAdminClient().storage.from("demand-files");
  const staged: { kind: string; path: string; name: string; mime: string }[] = [];
  for (const file of source) {
    const path = `${targetDemandId}/${kind}/${crypto.randomUUID()}-${storageCopyName(file.name)}`;
    const { error: copyError } = await bucket.copy(file.path, path);
    if (copyError) {
      if (staged.length) await bucket.remove(staged.map((item) => item.path));
      return { files: [] as DemandFileRecord[], error: copyError.message || "Não foi possível copiar as referências." };
    }
    staged.push({ kind: file.kind, path, name: file.name, mime: file.mime });
  }

  const { data, error } = await supabase
    .from("demand_files")
    .insert(staged.map((file) => ({
      demand_id: targetDemandId,
      kind: file.kind,
      path: file.path,
      name: file.name,
      mime: file.mime,
      created_by: userId,
    })))
    .select("id, demand_id, kind, path, name, mime, created_at");
  if (error || !data) {
    await bucket.remove(staged.map((item) => item.path));
    return { files: [] as DemandFileRecord[], error: error?.message || "Não foi possível copiar as referências." };
  }
  return { files: data.map(mapFile), error: null };
}

export async function createDemandFileSignedUrl(path: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("demand-files").createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return { url: null, error: error?.message || "Não foi possível gerar o download." };
  return { url: data.signedUrl, error: null };
}
