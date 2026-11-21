import { NextResponse } from "next/server";
import { listNotifications, markNotificationsRead } from "@/lib/spaces/data";
import { guardSpaces, respond } from "@/lib/spaces/http";

export async function GET() {
  const { user, response } = await guardSpaces();
  if (response) return response;
  return NextResponse.json({ data: await listNotifications(user!.id) });
}

export async function PATCH() {
  const { user, response } = await guardSpaces();
  if (response) return response;
  return respond(await markNotificationsRead(user!.id));
}
