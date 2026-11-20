import { deleteExpenseCategory, saveExpenseCategory } from "@/lib/finance/data";
import { ADMIN_PATHS, guard, parseBody, respond, type IdContext } from "@/lib/finance/http";
import { expenseCategorySchema } from "@/lib/validations/finance";

export async function PUT(request: Request, context: IdContext) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, expenseCategorySchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await saveExpenseCategory(id, body.data), 200, ADMIN_PATHS);
}

export async function DELETE(_request: Request, context: IdContext) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const { id } = await context.params;
  return respond(await deleteExpenseCategory(id), 200, ADMIN_PATHS);
}
