export const GALLERY_MAX = 8;
export const GALLERY_BUCKET = "space-files";

const MIME_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export function parseGallery(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && /^https?:\/\//i.test(item));
  } catch {
    return /^https?:\/\//i.test(value) ? [value] : [];
  }
}

export function galleryContentType(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (MIME_BY_EXT[ext]) return MIME_BY_EXT[ext];
  if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif") return file.type;
  return "";
}
