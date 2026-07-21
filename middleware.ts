import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Route-level gate for the entire /admin subtree. `lib/services/auth-
 * service.ts`'s requireAdmin() is the second, redundant check inside the
 * protected layout — this is the first: nothing under /admin (other than
 * the login page itself) should even start rendering for a non-admin
 * session.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute && !isLoginPage && !req.auth?.user?.isAdmin) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
