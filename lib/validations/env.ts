import { z } from "zod";

/**
 * Convention: Zod validates everything crossing a trust boundary — env
 * vars, Server Action inputs, editor payloads (Phase 4+). This file
 * covers the one env var that's genuinely our business logic rather than
 * Auth.js's own concern: AUTH_SECRET/AUTH_GITHUB_ID/AUTH_GITHUB_SECRET are
 * validated by Auth.js itself with its own clear errors, but ADMIN_EMAIL
 * — the single-admin allowlist check in auth.ts's signIn callback — is
 * ours, so we validate it ourselves rather than trust an unchecked string.
 *
 * Deliberately lazy (a function, not a module-level `parse()` call): this
 * only runs when someone actually attempts to sign in, so a missing
 * ADMIN_EMAIL fails loudly at that moment instead of silently coupling
 * `next build` to having auth secrets configured. The public site must
 * never fail to build because an admin-only env var is unset.
 */
const adminEmailSchema = z.string().email();

export function getAdminEmail(): string {
  const result = adminEmailSchema.safeParse(process.env.ADMIN_EMAIL);
  if (!result.success) {
    throw new Error(
      "ADMIN_EMAIL is missing or not a valid email address. Set it in .env.local — see .env.example."
    );
  }
  return result.data;
}
