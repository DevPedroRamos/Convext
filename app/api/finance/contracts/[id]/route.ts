import { deleteContract, saveContract, setContractStatus } from "@/lib/finance/data";
import { COMMERCIAL_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { contractSchema, contractStatusSchema } from "@/lib/validations/finance";

export async function PUT(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, contractSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await saveContract(id, body.data), 200, [...COMMERCIAL_PATHS, `/app/financeiro/contratos/${id}`]);
}

export async function PATCH(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, contractStatusSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await setContractStatus(id, body.data.status, body.data.endDate || undefined), 200, [...COMMERCIAL_PATHS, `/app/financeiro/contratos/${id}`]);
}

export async function DELETE(_request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial", { adminOnly: true });
  if (denied) return denied;
  const { id } = await context.params;
  return respond(await deleteContract(id), 200, COMMERCIAL_PATHS);
}
