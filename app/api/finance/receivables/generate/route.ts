import { z } from "zod";
import { parseMonth, todayIso } from "@/lib/finance/dates";
import { generateReceivables } from "@/lib/finance/data";
import { ADMIN_PATHS, COMMERCIAL_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { generateReceivablesSchema } from "@/lib/validations/finance";

const schema = generateReceivablesSchema.extend({ contractId: z.string().uuid().optional() });

export async function POST(request: Request) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, schema);
  if (body.response) return body.response;
  const month = parseMonth(body.data.month, todayIso());
  return respond(await generateReceivables(month, body.data.contractId), 200, [...COMMERCIAL_PATHS, ...ADMIN_PATHS]);
}
