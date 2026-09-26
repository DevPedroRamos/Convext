import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "convext", timestamp: new Date().toISOString() });
}
