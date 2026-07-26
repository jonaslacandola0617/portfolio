import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge-safe route gate for /admin/*.
 *
 * This used to `import { auth } from "@/auth"` and call the full Auth.js
 * `auth()` wrapper directly in middleware. That pulled the entire
 * next-auth -> @auth/core -> jose chain into the Edge Runtime bundle;
 * jose's JWE compression codepath (`CompressionStream`/
 * `DecompressionStream`, used when decrypting the session cookie) isn't
 * a supported Edge Runtime API under Next.js 14, which is exactly the
 * warning `docs/REQUIRED_BASELINE_BUILD_REPAIR.md` §4 documents.
 *
 * The fix is to stop doing real session verification in Edge Middleware
 * at all. This file now only checks whether an Auth.js session cookie is
 * *present* — a cheap, Edge-safe check that needs no crypto and no
 * next-auth import — and redirects immediately if it's missing. Cookie
 * names match `@auth/core`'s `defaultCookies()` (checked directly against
 * the installed version in node_modules/@auth/core/lib/utils/cookie.js):
 * `authjs.session-token` in development, `__Secure-authjs.session-token`
 * once `useSecureCookies` is on (i.e. HTTPS in production).
 *
 * SECURITY — READ BEFORE CHANGING:
 * A cookie being *present* proves nothing about it being valid. This
 * middleware is an optimization (redirect the common case — no cookie at
 * all — before any page rendering starts), not an authorization
 * decision. The real, cryptographic session check still happens on every
 * request that reaches a protected page:
 *   1. `requireAdmin()` in `app/admin/(dashboard)/layout.tsx` calls the
 *      real `auth()` (Node.js runtime, not Edge — CompressionStream is a
 *      standard Node global there, no warning, no workaround needed) and
 *      redirects to `/admin/login` if the session doesn't verify.
 *   2. Every mutation Server Action independently calls `requireAdmin()`
 *      again (see ARCHITECTURE.md §7 rule 8) — reaching a page was never
 *      sufficient authorization for a Server Action to trust its caller.
 * A forged or stale cookie value passes *this* file's check (it only
 * looks at cookie *names*) but is rejected by `requireAdmin()`'s real
 * verification. Do not treat this file as the authorization boundary —
 * it never was even before this change, since `requireAdmin()` in the
 * layout has always been the documented defense-in-depth second check,
 * not a redundant no-op.
 */

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
] as const;

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoginPage = pathname === "/admin/login";
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isAdminRoute || isLoginPage) {
    return NextResponse.next();
  }

  const hasSessionCookie = SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
  if (!hasSessionCookie) {
    const loginUrl = new URL("/admin/login", req.nextUrl.origin);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
