import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { canAccessPath } from "@/lib/access";
import { getPublicSupabaseEnv } from "@/lib/env";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getPublicSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/app");
  const isAuth = ["/login", "/esqueci-senha", "/redefinir-senha"].includes(pathname);

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuth) {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  if (user && isProtected) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .maybeSingle();
    const onboarded = Boolean(profile?.onboarding_completed);
    const { data: accessActive, error: accessError } = await supabase.rpc("employee_access_is_active");
    if (onboarded && (!accessActive || accessError)) {
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(new URL("/login?error=inactive", request.url));
      response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
      return redirectResponse;
    }
    if (!onboarded && pathname !== "/app/onboarding") {
      return NextResponse.redirect(new URL("/app/onboarding", request.url));
    }
    if (onboarded && pathname === "/app/onboarding") {
      return NextResponse.redirect(new URL("/app", request.url));
    }
    if (onboarded && !canAccessPath(profile?.role, pathname)) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|media|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
