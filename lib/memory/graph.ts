// Camada de grafo: relaciona documentos, entidades do glossário, decisões (ADR), tags e
// arquivos de código. Também importa o graph.json do Graphify (NetworkX node-link) para
// ligar conceitos extraídos do código aos documentos.
import { mentionCount, parseGlossary } from "@/lib/memory/markdown";
import { normalize, slugify } from "@/lib/memory/text";
import type { GlossaryEntry, Graph, GraphEdge, GraphNode, ParsedDocument } from "@/lib/memory/types";

export const docNodeId = (path: string) => `doc:${path}`;
export const entityNodeId = (term: string) => `entity:${slugify(term)}`;
const fileNodeId = (path: string) => `file:${path}`;
const tagNodeId = (tag: string) => `tag:${slugify(tag)}`;

export type EntityNode = { id: string; label: string; definition: string; avoid: string[] };

function addEdge(edges: Map<string, GraphEdge>, edge: GraphEdge) {
  if (edge.src === edge.dst) return;
  const key = `${edge.src}|${edge.dst}|${edge.relation}`;
  const existing = edges.get(key);
  if (existing) existing.weight = Math.max(existing.weight, edge.weight);
  else edges.set(key, edge);
}

export function glossaryEntities(docs: ParsedDocument[]): EntityNode[] {
  const entries: GlossaryEntry[] = docs.filter((doc) => doc.kind === "glossary").flatMap((doc) => parseGlossary(doc.body));
  return entries.map((entry) => ({ id: entityNodeId(entry.term), label: entry.term, definition: entry.definition, avoid: entry.avoid }));
}

/**
 * Monta o grafo a partir das notas. `knownEntities` e `knownPaths` permitem ingestão parcial
 * (uma nota de memória nova) ligar-se a entidades e documentos já indexados.
 */
export function buildGraph(docs: ParsedDocument[], knownEntities: EntityNode[] = [], knownPaths: string[] = []): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  const byKey = new Map<string, string>();

  // Documentos já indexados (ingestão parcial): resolvem links sem recriar seus nós.
  for (const path of knownPaths) {
    const base = path.split("/").pop()!.replace(/\.mdc?$/, "");
    for (const key of [path, path.replace(/\.mdc?$/, ""), base]) byKey.set(normalize(key), docNodeId(path));
  }

  for (const doc of docs) {
    const id = docNodeId(doc.path);
    nodes.set(id, { id, kind: doc.kind, label: doc.title, props: { path: doc.path } });
    const base = doc.path.split("/").pop()!.replace(/\.mdc?$/, "");
    for (const key of [doc.path, doc.path.replace(/\.mdc?$/, ""), base, doc.title]) byKey.set(normalize(key), id);
  }

  const resolve = (target: string) => byKey.get(normalize(target)) ?? byKey.get(normalize(target.split("/").pop() ?? target));

  const entities = new Map<string, EntityNode>();
  for (const entity of [...knownEntities, ...glossaryEntities(docs)]) entities.set(entity.id, entity);
  for (const entity of entities.values()) {
    nodes.set(entity.id, { id: entity.id, kind: "entity", label: entity.label, props: { definition: entity.definition, avoid: entity.avoid } });
  }

  for (const doc of docs) {
    const src = docNodeId(doc.path);
    const linkRelation = doc.kind === "decision" ? "decides" : "links_to";
    for (const target of [...doc.wikilinks, ...doc.mdLinks]) {
      const dst = resolve(target);
      if (dst) addEdge(edges, { src, dst, relation: linkRelation, weight: 1 });
    }
    for (const tag of doc.tags) {
      const id = tagNodeId(tag);
      nodes.set(id, { id, kind: "tag", label: tag });
      addEdge(edges, { src, dst: id, relation: "tagged", weight: 0.5 });
    }
    for (const path of doc.codePaths) {
      const id = fileNodeId(path);
      nodes.set(id, { id, kind: "file", label: path });
      addEdge(edges, { src, dst: id, relation: "references", weight: 0.75 });
    }
    for (const entity of entities.values()) {
      if (doc.kind === "glossary") {
        if (mentionCount(doc.body, entity.label) > 0) addEdge(edges, { src: entity.id, dst: src, relation: "defined_in", weight: 1 });
        continue;
      }
      const count = mentionCount(`${doc.title}\n${doc.body}`, entity.label);
      if (count > 0) addEdge(edges, { src, dst: entity.id, relation: "mentions", weight: Math.min(1, 0.2 + count / 10) });
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

type GraphifyJson = {
  nodes?: Array<Record<string, unknown>>;
  links?: Array<Record<string, unknown>>;
  edges?: Array<Record<string, unknown>>;
};

/**
 * Converte o `graphify-out/graph.json` (formato node-link do NetworkX) para o grafo da
 * memória. Nós ganham prefixo `gfy:`; o arquivo de origem vira aresta para `file:` ou `doc:`,
 * conectando o grafo do código ao grafo da documentação.
 */
export function parseGraphify(json: GraphifyJson): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  for (const raw of json.nodes ?? []) {
    const rawId = String(raw.id ?? "");
    if (!rawId) continue;
    const id = `gfy:${rawId}`;
    const sourceFile = typeof raw.source_file === "string" ? raw.source_file.replace(/\\/g, "/").replace(/^\.\//, "") : null;
    nodes.set(id, {
      id,
      kind: String(raw.type ?? raw.file_type ?? raw.kind ?? "concept"),
      label: String(raw.label ?? raw.name ?? rawId),
      props: { ...(sourceFile ? { sourceFile } : {}), ...(raw.community !== undefined ? { community: raw.community } : {}) },
    });
    if (sourceFile) {
      const target = /\.mdc?$/.test(sourceFile) ? docNodeId(sourceFile) : fileNodeId(sourceFile);
      if (!target.startsWith("doc:")) nodes.set(target, { id: target, kind: "file", label: sourceFile });
      addEdge(edges, { src: id, dst: target, relation: "source", weight: 0.75 });
    }
  }
  for (const raw of json.links ?? json.edges ?? []) {
    const src = `gfy:${String(raw.source ?? "")}`;
    const dst = `gfy:${String(raw.target ?? "")}`;
    if (!nodes.has(src) || !nodes.has(dst)) continue;
    const confidence = typeof raw.confidence_score === "number" ? raw.confidence_score : typeof raw.weight === "number" ? raw.weight : 1;
    addEdge(edges, { src, dst, relation: String(raw.relation ?? raw.type ?? "related"), weight: Math.max(0.1, Math.min(1, confidence)) });
  }
  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

const relationFactor: Record<string, number> = {
  links_to: 1,
  decides: 1,
  mentions: 0.8,
  defined_in: 1,
  references: 0.6,
  source: 0.6,
  tagged: 0.4,
};

/**
 * Peso de documentos relacionados às sementes (documentos mais relevantes + entidades
 * citadas na pergunta). Um salto direto, e dois saltos através de arquivos de código,
 * tags e nós do Graphify — nunca através de entidades, que conectariam quase tudo.
 */
export function relatedDocumentWeights(edges: GraphEdge[], seeds: string[]) {
  const seedSet = new Set(seeds);
  // Normalização por grau: um nó ligado a quase tudo (entidade genérica como "Demanda", um
  // índice/MOC) espalha pouco peso para cada vizinho. Sem isso o grafo reforça ruído.
  const degree = new Map<string, number>();
  for (const edge of edges) {
    degree.set(edge.src, (degree.get(edge.src) ?? 0) + 1);
    degree.set(edge.dst, (degree.get(edge.dst) ?? 0) + 1);
  }
  const spread = (node: string) => 1 / Math.sqrt(Math.max(1, degree.get(node) ?? 1));
  const weights = new Map<string, number>();
  const bump = (node: string, value: number) => {
    if (!node.startsWith("doc:") || seedSet.has(node)) return;
    weights.set(node, Math.min(1, (weights.get(node) ?? 0) + value));
  };
  const hubs = new Map<string, number>();
  for (const edge of edges) {
    const factor = (relationFactor[edge.relation] ?? 0.5) * edge.weight;
    for (const [from, to] of [[edge.src, edge.dst], [edge.dst, edge.src]] as const) {
      if (!seedSet.has(from)) continue;
      const value = from.startsWith("doc:") && to.startsWith("doc:") ? factor : factor * spread(from);
      bump(to, value * (from.startsWith("doc:") ? Math.min(1, 2 * spread(from)) : 1));
      if (!to.startsWith("doc:") && !to.startsWith("entity:")) hubs.set(to, Math.max(hubs.get(to) ?? 0, factor));
    }
  }
  for (const edge of edges) {
    for (const [from, to] of [[edge.src, edge.dst], [edge.dst, edge.src]] as const) {
      const hub = hubs.get(from);
      if (hub) bump(to, hub * (relationFactor[edge.relation] ?? 0.5) * edge.weight * 0.5 * spread(from));
    }
  }
  return weights;
}

/** Entidades do glossário citadas no texto (por termo ou sinônimo a evitar). */
export function matchEntities(text: string, entities: EntityNode[]) {
  return entities.filter((entity) => mentionCount(text, entity.label) > 0);
}
