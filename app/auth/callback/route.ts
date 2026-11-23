import { NextResponse, type NextRequest } from "next/server";
import { hasPasswordSet } from "@/lib/profile";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const { data: { user } } = await supabase.auth.getUser();
    const next = requestedNext || (user && !hasPasswordSet(user) ? "/app/onboarding" : "/app");
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(new URL(requestedNext || "/app", requestUrl.origin));
}
