import { createClient } from "@/lib/supabase/browser";
import type { DemandFileKind } from "@/lib/validations/demand";

function safeName(name: string) {
  return name.replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-").slice(0, 80) || "arquivo";
}

export async function uploadDemandFile(demandId: string, file: File, kind: DemandFileKind) {
  const supabase = createClient();
  const path = `${demandId}/${kind}/${crypto.randomUUID()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from("demand-files").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) return { error: error.message };

  try {
    const response = await fetch(`/api/demandas/${demandId}/files`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        path,
        name: file.name,
        mime: file.type || "application/octet-stream",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      await supabase.storage.from("demand-files").remove([path]);
      return { error: payload.error || "Não foi possível anexar o arquivo." };
    }
    return { error: null };
  } catch {
    await supabase.storage.from("demand-files").remove([path]);
    return { error: "Não foi possível anexar o arquivo." };
  }
}

export async function uploadDemandFiles(demandId: string, files: File[], kind: DemandFileKind) {
  for (const file of files) {
    const result = await uploadDemandFile(demandId, file, kind);
    if (result.error) return result;
  }
  return { error: null };
}
