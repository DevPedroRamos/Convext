import { deleteForm, saveForm } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond, type IdContext } from "@/lib/spaces/http";
import { spaceFormSchema } from "@/lib/validations/spaces";

export async function PUT(request: Request, context: IdContext) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const body = await parseBody(request, spaceFormSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await saveForm(id, body.data));
}

export async function DELETE(_request: Request, context: IdContext) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const { id } = await context.params;
  return respond(await deleteForm(id));
}
