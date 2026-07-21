import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { getAdminEmail } from "@/lib/validations/env";

/**
 * Single-admin auth, deliberately adapter-less.
 *
 * There is exactly one person who should ever reach /admin, identified by
 * ADMIN_EMAIL. JWT session strategy means no Session/Account/User tables
 * in Postgres at all — Auth.js encodes everything it needs into a signed,
 * httpOnly cookie. `signIn` is the enforcement point: anyone can start the
 * GitHub OAuth flow, but only the allow-listed email is granted a session.
 *
 * This intentionally does NOT export a PrismaAdapter. If a second admin or
 * account-linking is ever needed, that's the point to add one — see
 * docs/CMS_MIGRATION_PLAN.md.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [GitHub],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ profile }) {
      const allowedEmail = getAdminEmail();
      return profile?.email?.toLowerCase() === allowedEmail.toLowerCase();
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.isAdmin = true;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.isAdmin = Boolean(token.isAdmin);
      return session;
    },
  },
  pages: {
    // Phase 1 will add app/admin/login/page.tsx to match this path.
    // Until then this is unused — no route reads it yet.
    signIn: "/admin/login",
  },
});
