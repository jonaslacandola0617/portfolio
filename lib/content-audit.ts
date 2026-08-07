import type { PrismaClient } from "@prisma/client";
import {
  diagnoseTipTapDocument,
  formatContentDiagnostic,
  type ContentDiagnostic,
  type ContentRecordContext,
} from "@/lib/content-diagnostics";
import { tiptapDocSchema } from "@/lib/validations/content";

export interface InvalidContentRecord {
  context: ContentRecordContext;
  diagnostic: ContentDiagnostic;
}

export interface ContentAuditSummary {
  checked: Record<ContentRecordContext["model"], number>;
  invalid: InvalidContentRecord[];
}

interface AuditableRow {
  id: string;
  slug: string;
  title: string;
  content: unknown;
}

async function loadRecords(prisma: PrismaClient): Promise<Record<ContentRecordContext["model"], AuditableRow[]>> {
  const [projects, labs, articles, certificates] = await Promise.all([
    prisma.project.findMany({ select: { id: true, slug: true, title: true, content: true } }),
    prisma.lab.findMany({ select: { id: true, slug: true, title: true, content: true } }),
    prisma.article.findMany({ select: { id: true, slug: true, title: true, content: true } }),
    prisma.certificate.findMany({ select: { id: true, slug: true, name: true, content: true } }),
  ]);

  return {
    Project: projects,
    Lab: labs,
    Article: articles,
    Certificate: certificates
      .filter((row) => row.content !== null)
      .map((row) => ({ id: row.id, slug: row.slug, title: row.name, content: row.content })),
  };
}

export async function auditDatabaseContent(prisma: PrismaClient): Promise<ContentAuditSummary> {
  const records = await loadRecords(prisma);
  const checked: ContentAuditSummary["checked"] = {
    Project: 0,
    Lab: 0,
    Article: 0,
    Certificate: 0,
  };
  const invalid: InvalidContentRecord[] = [];

  for (const model of Object.keys(records) as ContentRecordContext["model"][]) {
    for (const record of records[model]) {
      if (record.content === null) continue;
      checked[model]++;
      const result = tiptapDocSchema.safeParse(record.content);
      if (!result.success) {
        invalid.push({
          context: {
            model,
            id: record.id,
            slug: record.slug,
            title: record.title,
          },
          diagnostic: diagnoseTipTapDocument(record.content, result.error),
        });
      }
    }
  }

  return { checked, invalid };
}

export function printContentAudit(summary: ContentAuditSummary): void {
  for (const invalid of summary.invalid) {
    console.error(formatContentDiagnostic(invalid.context, invalid.diagnostic));
  }
  for (const model of Object.keys(summary.checked) as ContentRecordContext["model"][]) {
    const invalidCount = summary.invalid.filter((item) => item.context.model === model).length;
    console.log(`[content-audit] ${model}: checked=${summary.checked[model]} invalid=${invalidCount}`);
  }
  console.log(
    `[content-audit] total=${Object.values(summary.checked).reduce((sum, count) => sum + count, 0)} invalid=${summary.invalid.length}`
  );
}
