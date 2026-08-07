import type { DefaultSession } from "next-auth";

/**
 * Extends Auth.js's built-in types with the one custom field this project
 * needs. Single-admin app, so this is deliberately minimal — no role enum,
 * just a boolean that's only ever true for the allow-listed ADMIN_EMAIL
 * (see auth.ts's signIn callback).
 */
declare module "next-auth" {
  interface Session {
    user: {
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean;
  }
}
