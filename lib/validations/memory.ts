import { z } from "zod";

const project = z.string().trim().min(1).max(64).regex(/^[a-z0-9][a-z0-9_-]*$/, "Use minúsculas, números, - ou _.").default("convext");
const agent = z.string().trim().max(64).optional();
const history = z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(40_000) })).max(200).optional();

export const ingestSchema = z.object({
  project,
  documents: z.array(z.object({ path: z.string().min(1).max(300), content: z.string().max(400_000) })).min(1).max(500),
  pinned: z.array(z.string()).max(50).optional(),
  prune: z.boolean().optional(),
});

export const searchSchema = z.object({
  project,
  query: z.string().trim().min(2).max(2000),
  k: z.number().int().min(1).max(30).default(8),
  kinds: z.array(z.string()).max(10).optional(),
});

export const contextSchema = z.object({
  project,
  agent,
  task: z.string().trim().min(2).max(8000),
  budgetTokens: z.number().int().min(200).max(20_000).optional(),
  k: z.number().int().min(1).max(30).optional(),
  history,
  useGraph: z.boolean().optional(),
  kinds: z.array(z.string()).max(10).optional(),
});

export const askSchema = contextSchema.extend({
  model: z.string().max(64).optional(),
  effort: z.enum(["low", "medium", "high"]).optional(),
  maxTokens: z.number().int().min(256).max(16_000).optional(),
  mustInclude: z.array(z.string().max(200)).max(20).optional(),
});

export const memoryNoteSchema = z.object({
  project,
  title: z.string().trim().min(3).max(140),
  content: z.string().trim().min(3).max(20_000),
  type: z.enum(["decision", "fact", "preference", "lesson"]).default("fact"),
  tags: z.array(z.string().trim().max(40)).max(10).default([]),
  related: z.array(z.string().trim().max(200)).max(10).default([]),
  agent,
});

export const graphImportSchema = z.object({
  project,
  graph: z.object({
    nodes: z.array(z.record(z.unknown())).max(50_000),
    links: z.array(z.record(z.unknown())).max(200_000).optional(),
    edges: z.array(z.record(z.unknown())).max(200_000).optional(),
  }),
});

export const evalSchema = z.object({
  project,
  mode: z.enum(["retrieval", "answer"]).default("retrieval"),
  k: z.number().int().min(1).max(20).default(5),
  cases: z
    .array(
      z.object({
        id: z.string().max(80),
        query: z.string().min(2).max(2000),
        agent,
        relevant: z.array(z.string()).max(20),
        mustInclude: z.array(z.string()).max(20).optional(),
      }),
    )
    .min(1)
    .max(100),
  model: z.string().max(64).optional(),
});
