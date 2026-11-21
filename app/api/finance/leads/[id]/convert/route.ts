import { convertLead } from "@/lib/finance/data";
import { COMMERCIAL_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { convertLeadSchema } from "@/lib/validations/finance";

export async function POST(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, convertLeadSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await convertLead(id, body.data), 201, COMMERCIAL_PATHS);
}
