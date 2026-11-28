const ADMIN_ORIGIN = "https://catalove-admin.invalid";

/** Keep post-login redirects on admin pages from this app. */
export function getSafeAdminRedirectPath(next?: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\u0000-\u001f]/.test(next)) {
    return "/admin";
  }

  try {
    const url = new URL(next, ADMIN_ORIGIN);
    if (url.origin !== ADMIN_ORIGIN || (url.pathname !== "/admin" && !url.pathname.startsWith("/admin/"))) {
      return "/admin";
    }
    if (url.pathname === "/admin/login" || url.pathname === "/admin/register") return "/admin";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/admin";
  }
}
