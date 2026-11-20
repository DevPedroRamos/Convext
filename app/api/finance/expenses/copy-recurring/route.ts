import { parseMonth, todayIso } from "@/lib/finance/dates";
import { copyRecurringExpenses } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { generateReceivablesSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, generateReceivablesSchema);
  if (body.response) return body.response;
  return respond(await copyRecurringExpenses(parseMonth(body.data.month, todayIso())), 200, ADMIN_PATHS);
}
