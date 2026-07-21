import { PrismaClient } from "@prisma/client";

/**
 * Next.js dev mode hot-reloads modules on every save, which would otherwise
 * spin up a brand new PrismaClient (and a new connection pool) on every
 * edit. Caching the instance on `globalThis` in development avoids
 * exhausting Postgres connections. In production there's one module
 * instantiation, so this is a no-op there.
 *
 * The instance is built lazily, inside a Proxy, rather than as
 * `export const prisma = new PrismaClient()` at module scope. That
 * distinction matters more than it looks: `new PrismaClient()` throws
 * synchronously if `prisma generate` hasn't run yet (a real state this
 * project sits in before Neon is wired up, or before the very first
 * deploy). A module-scope constructor call throws the moment ANYTHING
 * imports this file — including Next.js evaluating Server Component
 * modules during `next build`'s page-data collection — which crashes the
 * entire build, not just the one page that needed a DB. Deferring
 * construction to first property access means that throw happens inside
 * whichever query function touched `prisma` first, which is exactly
 * where callers (see lib/services/dashboard-service.ts) already expect
 * to catch it.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop, receiver);
  },
});
