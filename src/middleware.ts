import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const tenantRoute = pathname.match(/^\/s\/([^/]+)(\/.*)?$/);
  if (tenantRoute) {
    const [, slug, remainder = "/"] = tenantRoute;
    if (!/^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(slug) || remainder.startsWith("/admin")) {
      return new NextResponse("Not Found", { status: 404 });
    }
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = remainder || "/";
    const headers = new Headers(request.headers);
    headers.set("x-catalove-store-slug", slug);
    const response = NextResponse.rewrite(rewriteUrl, { request: { headers } });
    response.cookies.set("catalove_store_slug", slug, {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  const cookieSlug = request.cookies.get("catalove_store_slug")?.value;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isApi = pathname.startsWith("/api/");
  if (!isAdmin && !isApi && cookieSlug && /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(cookieSlug)) {
    const tenantUrl = request.nextUrl.clone();
    tenantUrl.pathname = `/s/${cookieSlug}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(tenantUrl, 307);
  }

  const headers = new Headers(request.headers);
  if (cookieSlug && /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/.test(cookieSlug)) {
    headers.set("x-catalove-store-slug", cookieSlug);
  }

  // Canvas mode is a private editing preview, not a second public landing page.
  if (pathname === "/" && request.nextUrl.searchParams.get("canvas") === "1") {
    const response = NextResponse.next({ request: { headers } });
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  // Only protect /admin routes (except /admin/login)
  if (!isAdmin || pathname === "/admin/login" || pathname === "/admin/register") {
    return NextResponse.next({ request: { headers } });
  }

  // Verify admin access only with a Supabase Auth session.
  if (isSupabaseConfigured()) {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: "", ...options });
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            response.cookies.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { data: membership, error: membershipError } = await supabase
      .from("store_memberships")
      .select("store_id")
      .limit(1)
      .maybeSingle();
    if (membershipError || !membership) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      loginUrl.searchParams.set("reason", membershipError ? "access-check-failed" : "access-denied");
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // Without Supabase Auth, keep admin routes inaccessible.
  const loginUrl = new URL("/admin/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
