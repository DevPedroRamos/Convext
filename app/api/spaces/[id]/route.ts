import { NextResponse } from "next/server";
import { deleteSpace, saveSpace } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond, type IdContext } from "@/lib/spaces/http";
import { flowProblems } from "@/lib/spaces/rules";
import { spaceSchema } from "@/lib/validations/spaces";

export async function PUT(request: Request, context: IdContext) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const body = await parseBody(request, spaceSchema);
  if (body.response) return body.response;
  const problems = flowProblems(body.data.stages);
  if (problems.length) return NextResponse.json({ error: problems[0] }, { status: 400 });
  const { id } = await context.params;
  return respond(await saveSpace(id, body.data));
}

export async function DELETE(_request: Request, context: IdContext) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const { id } = await context.params;
  return respond(await deleteSpace(id));
}
