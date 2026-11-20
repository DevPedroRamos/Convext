import { z } from "zod";
import { handleMemory } from "@/lib/memory/http";
import { summarizeRuns } from "@/lib/memory/metrics";

const metricsSchema = z.object({
  project: z.string().default("convext"),
  days: z.coerce.number().int().min(1).max(90).default(7),
});

export function GET(request: Request) {
  return handleMemory(request, metricsSchema, async (input, ctx) => {
    const since = new Date(Date.now() - input.days * 86_400_000).toISOString();
    const runs = await ctx.store.listRuns(input.project, since, 5000);
    return { project: input.project, since, ...summarizeRuns(runs) };
  });
}
