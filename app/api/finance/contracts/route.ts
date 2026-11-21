import { saveContract } from "@/lib/finance/data";
import { COMMERCIAL_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { contractSchema } from "@/lib/validations/finance";

export async function POST(request: Request) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, contractSchema);
  if (body.response) return body.response;
  return respond(await saveContract(null, body.data), 201, COMMERCIAL_PATHS);
}
