import { saveSpace } from "@/lib/spaces/data";
import { guardSpaces, parseBody, respond } from "@/lib/spaces/http";
import { flowProblems } from "@/lib/spaces/rules";
import { spaceSchema } from "@/lib/validations/spaces";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { response } = await guardSpaces({ admin: true });
  if (response) return response;
  const body = await parseBody(request, spaceSchema);
  if (body.response) return body.response;
  const problems = flowProblems(body.data.stages);
  if (problems.length) return NextResponse.json({ error: problems[0] }, { status: 400 });
  return respond(await saveSpace(null, body.data), 201);
}
