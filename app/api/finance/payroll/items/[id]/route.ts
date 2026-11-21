import { updatePayrollItem } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { payrollItemPatchSchema } from "@/lib/validations/finance";

export async function PATCH(request: Request, context: IdContext) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, payrollItemPatchSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await updatePayrollItem(id, body.data), 200, ADMIN_PATHS);
}
