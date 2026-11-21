import { deleteProposal, saveProposal, setProposalStatus } from "@/lib/finance/data";
import { COMMERCIAL_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { proposalSchema, proposalStatusSchema } from "@/lib/validations/finance";

export async function PUT(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, proposalSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await saveProposal(id, body.data), 200, COMMERCIAL_PATHS);
}

export async function PATCH(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, proposalStatusSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await setProposalStatus(id, body.data.status), 200, COMMERCIAL_PATHS);
}

export async function DELETE(_request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial", { adminOnly: true });
  if (denied) return denied;
  const { id } = await context.params;
  return respond(await deleteProposal(id), 200, COMMERCIAL_PATHS);
}
