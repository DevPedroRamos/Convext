import { saveFinanceSettings } from "@/lib/finance/data";
import { ADMIN_PATHS, COMMERCIAL_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { financeSettingsSchema } from "@/lib/validations/finance";

export async function PUT(request: Request) {
  const denied = await guard("financeiro_admin");
  if (denied) return denied;
  const body = await parseBody(request, financeSettingsSchema);
  if (body.response) return body.response;
  return respond(await saveFinanceSettings(body.data), 200, [...COMMERCIAL_PATHS, ...ADMIN_PATHS]);
}
