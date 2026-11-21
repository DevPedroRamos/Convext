import { deletePayrollRun, setPayrollRunStatus } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { payrollRunPatchSchema } from "@/lib/validations/finance";

export async function PATCH(request: Request, context: IdContext) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, payrollRunPatchSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await setPayrollRunStatus(id, body.data.status, body.data.paidAt || undefined), 200, ADMIN_PATHS);
}

export async function DELETE(_request: Request, context: IdContext) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const { id } = await context.params;
  return respond(await deletePayrollRun(id), 200, ADMIN_PATHS);
}
