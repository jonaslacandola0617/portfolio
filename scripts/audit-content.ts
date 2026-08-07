import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { auditDatabaseContent, printContentAudit } from "../lib/content-audit";

const prisma = new PrismaClient();

async function main() {
  const summary = await auditDatabaseContent(prisma);
  printContentAudit(summary);
  if (summary.invalid.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "unknown";
    console.error(`[content-audit] database audit failed code=${code}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
