import { saveQuickActions } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond } from "@/lib/spaces/http";
import { quickActionsSchema } from "@/lib/validations/spaces";

export async function PUT(request: Request) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const body = await parseBody(request, quickActionsSchema);
  if (body.response) return body.response;
  return respond(await saveQuickActions(body.data.actions));
}
