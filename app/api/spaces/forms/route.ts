import { saveForm } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond } from "@/lib/spaces/http";
import { spaceFormSchema } from "@/lib/validations/spaces";

export async function POST(request: Request) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const body = await parseBody(request, spaceFormSchema);
  if (body.response) return body.response;
  return respond(await saveForm(null, body.data), 201);
}
