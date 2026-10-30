import { persistConcept, prepareConceptHtml } from "@/lib/concept-html";
import { siteConfig } from "@/lib/site";
import type { CaseIdentity, CaseValues } from "@/lib/validations/case";
import type { Database, Json } from "@/types/database.types";

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];

export type CaseRecord = CaseValues & {
  id: string;
  slug: string;
  createdAt: string;
};

export function slugify(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 72);
  return slug || "case";
}

export function videoEmbedSrc(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

function parseIdentities(value: Json): CaseIdentity[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item) || typeof item.url !== "string") return [];
    return [{ url: item.url, caption: typeof item.caption === "string" ? item.caption : "" }];
  });
}

export function mapCase(row: CaseRow): CaseRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    segment: row.segment,
    summary: row.summary,
    logoUrl: row.logo_url,
    coverUrl: row.cover_url || "",
    concept: prepareConceptHtml(row.concept),
    location: row.location || "",
    fronts: row.fronts ?? [],
    videoUrl: row.video_url || "",
    identities: parseIdentities(row.identities),
    published: row.published,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function toCaseRow(values: CaseValues, slug: string) {
  return {
    slug,
    name: values.name.trim(),
    segment: values.segment.trim(),
    summary: values.summary.trim(),
    logo_url: values.logoUrl,
    cover_url: values.coverUrl || null,
    concept: persistConcept(values.concept),
    location: values.location?.trim() || null,
    fronts: values.fronts.map((item) => item.trim()).filter(Boolean),
    video_url: values.videoUrl || null,
    identities: values.identities.filter((item) => item.url) as Json,
    published: values.published,
    sort_order: values.sortOrder,
  };
}

export function placeholderCases(): CaseRecord[] {
  return siteConfig.projects.map((project, index) => ({
    id: `placeholder-${index}`,
    slug: "",
    name: project.title,
    segment: project.category,
    summary: "",
    logoUrl: project.image,
    coverUrl: project.image,
    concept: "",
    location: "",
    fronts: [],
    videoUrl: "",
    identities: [],
    published: true,
    sortOrder: index,
    createdAt: "",
  }));
}
