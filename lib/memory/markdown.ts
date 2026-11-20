// Leitura de notas no formato do vault Obsidian: frontmatter, [[wikilinks]], links
// markdown, referências a arquivos do código e chunking por seção.
import { estimateTokens, normalize, sha256 } from "@/lib/memory/text";
import type { DocKind, GlossaryEntry, ParsedChunk, ParsedDocument, SourceDocument } from "@/lib/memory/types";

export function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const text = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) return { data: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { data: {}, body: text };
  const data: Record<string, unknown> = {};
  let listKey: string | null = null;
  for (const line of text.slice(4, end).split("\n")) {
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && listKey) {
      (data[listKey] as unknown[]).push(parseScalar(item[1]));
      continue;
    }
    const pair = line.match(/^([\w-]+):\s*(.*)$/);
    if (!pair) continue;
    const [, key, value] = pair;
    if (value === "") {
      data[key] = [];
      listKey = key;
    } else {
      listKey = null;
      data[key] = value.startsWith("[") && value.endsWith("]")
        ? value.slice(1, -1).split(",").map((part) => parseScalar(part)).filter((part) => part !== "")
        : parseScalar(value);
    }
  }
  return { data, body: text.slice(end + 4).replace(/^\n/, "") };
}

function parseScalar(value: string): string | number | boolean {
  const trimmed = value.trim().replace(/^["']|["']$/g, "");
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

export function inferKind(path: string, frontmatter: Record<string, unknown> = {}): DocKind {
  const declared = frontmatter.kind;
  if (typeof declared === "string" && ["spec", "decision", "glossary", "product", "memory", "rule", "note"].includes(declared)) {
    return declared as DocKind;
  }
  const lower = path.toLowerCase();
  if (lower.includes("/adr/")) return "decision";
  if (lower.includes("/specs/")) return "spec";
  if (lower.includes("memorias/")) return "memory";
  if (lower.endsWith("glossary.md")) return "glossary";
  if (lower.endsWith("product.md") || lower.endsWith("convext-spec.md")) return "product";
  if (lower.includes(".cursor/rules/") || lower.endsWith(".mdc")) return "rule";
  return "note";
}

export function extractWikilinks(text: string) {
  const links = new Set<string>();
  for (const match of text.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g)) links.add(match[1].trim());
  return [...links];
}

export function extractMarkdownLinks(text: string, fromPath: string) {
  const links = new Set<string>();
  const baseDir = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/")) : "";
  for (const match of text.matchAll(/\]\(([^)\s]+?\.mdc?)(?:#[^)]*)?\)/g)) {
    const target = match[1];
    if (/^[a-z]+:\/\//i.test(target)) continue;
    links.add(resolvePath(baseDir, target));
  }
  return [...links];
}

function resolvePath(baseDir: string, target: string) {
  const parts = (target.startsWith("/") ? target.slice(1) : `${baseDir}/${target}`).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop();
    else out.push(part);
  }
  return out.join("/");
}

export function extractCodePaths(text: string) {
  const paths = new Set<string>();
  const pattern = /(?:^|[\s`(])((?:app|lib|components|supabase|types|scripts|tests|emails)\/[\w\-./[\]()@]+\.(?:ts|tsx|sql|mjs|js))/g;
  for (const match of text.matchAll(pattern)) paths.add(match[1]);
  return [...paths];
}

/** Formato do GLOSSARY.md (skill domain-modeling): **Termo**:\nDefinição\n_Avoid_: a, b */
export function parseGlossary(body: string): GlossaryEntry[] {
  const entries: GlossaryEntry[] = [];
  const pattern = /^\*\*([^*\n]+)\*\*:\s*\n((?:(?!\*\*[^*\n]+\*\*:)[^\n]+\n?)+)/gm;
  for (const match of body.matchAll(pattern)) {
    const lines = match[2].split("\n").map((line) => line.trim()).filter(Boolean);
    const avoidLine = lines.find((line) => /^_avoid_:/i.test(line));
    entries.push({
      term: match[1].trim(),
      definition: lines.filter((line) => line !== avoidLine).join(" "),
      avoid: avoidLine ? avoidLine.replace(/^_avoid_:\s*/i, "").split(",").map((part) => part.trim()).filter(Boolean) : [],
    });
  }
  return entries;
}

export function titleOf(path: string, frontmatter: Record<string, unknown>, body: string) {
  if (typeof frontmatter.title === "string" && frontmatter.title) return frontmatter.title;
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return path.split("/").pop()!.replace(/\.mdc?$/, "");
}

type Section = { heading: string; lines: string[] };

function splitSections(body: string): Section[] {
  const sections: Section[] = [];
  const stack: string[] = [];
  let current: Section = { heading: "", lines: [] };
  let inFence = false;
  for (const line of body.split("\n")) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const heading = !inFence ? line.match(/^(#{1,4})\s+(.+?)\s*#*\s*$/) : null;
    if (heading) {
      if (current.lines.some((l) => l.trim())) sections.push(current);
      const level = heading[1].length;
      stack.length = level - 1;
      stack[level - 1] = heading[2].replace(/`/g, "");
      current = { heading: stack.filter(Boolean).join(" > "), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.some((l) => l.trim())) sections.push(current);
  return sections;
}

function splitLongText(text: string, maxTokens: number) {
  const parts: string[] = [];
  let buffer = "";
  const flush = () => {
    if (buffer.trim()) parts.push(buffer.trim());
    buffer = "";
  };
  for (const paragraph of text.split(/\n{2,}/)) {
    if (estimateTokens(paragraph) > maxTokens) {
      flush();
      for (const line of paragraph.split("\n")) {
        if (estimateTokens(buffer + line) > maxTokens) flush();
        buffer += `${line}\n`;
      }
      flush();
      continue;
    }
    if (estimateTokens(`${buffer}\n\n${paragraph}`) > maxTokens) flush();
    buffer += `${buffer ? "\n\n" : ""}${paragraph}`;
  }
  flush();
  return parts;
}

/**
 * Chunking por seção de markdown. Seções pequenas vizinhas são unidas (menos cabeçalhos
 * repetidos no contexto); seções grandes são quebradas por parágrafo.
 */
export async function chunkMarkdown(body: string, options: { maxTokens?: number; minTokens?: number } = {}): Promise<ParsedChunk[]> {
  const maxTokens = options.maxTokens ?? 320;
  const minTokens = options.minTokens ?? 80;
  const pieces: { heading: string; content: string }[] = [];
  for (const section of splitSections(body)) {
    const text = section.lines.join("\n").trim();
    const last = pieces[pieces.length - 1];
    if (last && estimateTokens(last.content) < minTokens && estimateTokens(`${last.content}\n\n${text}`) <= maxTokens) {
      last.content = `${last.content}\n\n${text}`;
      continue;
    }
    for (const part of splitLongText(text, maxTokens)) pieces.push({ heading: section.heading, content: part });
  }
  return Promise.all(
    pieces.map(async (piece, position) => ({
      position,
      heading: piece.heading,
      content: piece.content,
      tokens: estimateTokens(piece.content),
      contentHash: await sha256(`${piece.heading}\n${piece.content}`),
    })),
  );
}

export async function parseDocument(source: SourceDocument, options: { pinned?: boolean } = {}): Promise<ParsedDocument> {
  const { data, body } = parseFrontmatter(source.content);
  const tags = Array.isArray(data.tags) ? data.tags.map(String) : typeof data.tags === "string" ? [data.tags] : [];
  const pinned = options.pinned ?? data.memory === "pinned";
  const related = Array.isArray(data.related) ? data.related.map((item) => String(item).replace(/^\[\[|\]\]$/g, "")) : [];
  return {
    path: source.path,
    title: titleOf(source.path, data, body),
    kind: inferKind(source.path, data),
    tags,
    pinned,
    frontmatter: data,
    body,
    content: source.content,
    contentHash: await sha256(`${pinned ? "pinned" : ""}\n${source.content}`),
    tokens: estimateTokens(body),
    wikilinks: [...new Set([...extractWikilinks(body), ...related])],
    mdLinks: extractMarkdownLinks(body, source.path),
    codePaths: extractCodePaths(body),
  };
}

export function mentionCount(text: string, term: string) {
  const needle = normalize(term);
  if (needle.length < 3) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (normalize(text).match(new RegExp(`(?<![a-z0-9])${escaped}s?(?![a-z0-9])`, "g")) ?? []).length;
}
