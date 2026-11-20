import { NextResponse } from "next/server";
import { createLead, listLeads } from "@/lib/finance/data";
import { COMMERCIAL_PATHS, guard, parseBody, respond } from "@/lib/finance/http";
import { leadSchema } from "@/lib/validations/finance";

export async function GET() {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  return NextResponse.json({ data: await listLeads() });
}

export async function POST(request: Request) {
  const denied = await guard("financeiro_comercial");
  if (denied) return denied;
  const body = await parseBody(request, leadSchema);
  if (body.response) return body.response;
  return respond(await createLead(body.data), 201, COMMERCIAL_PATHS);
}
