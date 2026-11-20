import { saveExpense } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { expenseSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, expenseSchema);
  if (body.response) return body.response;
  return respond(await saveExpense(null, body.data), 201, ADMIN_PATHS);
}
