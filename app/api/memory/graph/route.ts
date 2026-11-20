import { z } from "zod";
import { parseGraphify } from "@/lib/memory/graph";
import { handleMemory } from "@/lib/memory/http";
import { graphImportSchema } from "@/lib/validations/memory";

const neighborsSchema = z.object({
  project: z.string().default("convext"),
  node: z.string().min(3).max(300),
  depth: z.coerce.number().int().min(1).max(3).default(1),
});

/** Vizinhança de um nó: `?node=doc:docs/specs/demandas.md`, `entity:demanda`, `file:lib/demands.ts`. */
export function GET(request: Request) {
  return handleMemory(request, neighborsSchema, async (input, ctx) => ctx.store.neighbors(input.project, input.node, input.depth));
}

/** Importa o graph.json do Graphify (substitui a importação anterior, mantém o grafo dos docs). */
export function POST(request: Request) {
  return handleMemory(request, graphImportSchema, async (input, ctx) => {
    const graph = parseGraphify(input.graph);
    await ctx.store.writeGraph(input.project, graph, { source: "graphify", replace: true });
    return { nodes: graph.nodes.length, edges: graph.edges.length };
  });
}
