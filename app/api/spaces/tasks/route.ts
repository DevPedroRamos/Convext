import { createTask } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond } from "@/lib/spaces/http";
import { createTaskSchema } from "@/lib/validations/spaces";

export async function POST(request: Request) {
  const { response } = await guardSpaces();
  if (response) return response;
  const body = await parseBody(request, createTaskSchema);
  if (body.response) return body.response;
  return respond(await createTask(body.data), 201);
}
