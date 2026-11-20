import { parseMonth, todayIso } from "@/lib/finance/dates";
import { buildPayrollRun } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { payrollBuildSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, payrollBuildSchema);
  if (body.response) return body.response;
  return respond(await buildPayrollRun(parseMonth(body.data.month, todayIso())), 200, ADMIN_PATHS);
}
