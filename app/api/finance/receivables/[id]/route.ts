import { updateReceivable } from "@/lib/finance/data";
import { ADMIN_PATHS, COMMERCIAL_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { receivablePatchSchema } from "@/lib/validations/finance";

export async function PATCH(request: Request, context: IdContext) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, receivablePatchSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await updateReceivable(id, body.data), 200, [...COMMERCIAL_PATHS, ...ADMIN_PATHS]);
}
