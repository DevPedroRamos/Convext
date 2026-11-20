import { acceptProposal } from "@/lib/finance/data";
import { COMMERCIAL_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { acceptProposalSchema } from "@/lib/validations/finance";

export async function POST(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, acceptProposalSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await acceptProposal(id, body.data), 201, COMMERCIAL_PATHS);
}
