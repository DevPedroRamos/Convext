import { NextResponse } from "next/server";
import { deleteTask, getTaskEvents, runTaskAction } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond, type IdContext } from "@/lib/spaces/http";
import { taskActionSchema } from "@/lib/validations/spaces";

export async function GET(_request: Request, context: IdContext) {
  const { response } = await guardSpaces();
  if (response) return response;
  const { id } = await context.params;
  return NextResponse.json({ data: await getTaskEvents(id) });
}

export async function POST(request: Request, context: IdContext) {
  const { response } = await guardSpaces();
  if (response) return response;
  const body = await parseBody(request, taskActionSchema);
  if (body.response) return body.response;
  const { id } = await context.params;
  return respond(await runTaskAction(id, body.data));
}

export async function DELETE(_request: Request, context: IdContext) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const { id } = await context.params;
  return respond(await deleteTask(id));
}
