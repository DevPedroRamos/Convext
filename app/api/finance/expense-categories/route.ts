import { saveExpenseCategory } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { expenseCategorySchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, expenseCategorySchema);
  if (body.response) return body.response;
  return respond(await saveExpenseCategory(null, body.data), 201, ADMIN_PATHS);
}
