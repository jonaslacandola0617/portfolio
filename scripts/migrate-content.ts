import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";
import { tiptapDocSchema } from "../lib/validations/content";

const prisma = new PrismaClient();
const writeMode = process.argv.includes("--write");
const inlineTypes = new Set(["text", "hardBreak"]);

interface MigrationRecord {
  model: "Article" | "Certificate" | "Lab" | "Project";
  id: string;
  slug: string;
  title: string;
  before: Prisma.JsonValue;
  after: Prisma.InputJsonValue;
  changedPaths: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeNode(value: unknown, pathPrefix: string, changedPaths: string[]): unknown {
  if (!isRecord(value)) return value;
  const copy: Record<string, unknown> = { ...value };

  if (Array.isArray(value.content)) {
    let content: unknown[] = value.content.map((child, index) =>
      normalizeNode(child, `${pathPrefix}.content.${index}`, changedPaths)
    );

    if (value.type === "tableCell" || value.type === "tableHeader") {
      const normalized: unknown[] = [];
      let inlineRun: unknown[] = [];
      const flushInlineRun = () => {
        if (inlineRun.length === 0) return;
        normalized.push({ type: "paragraph", content: inlineRun });
        inlineRun = [];
      };
      for (let index = 0; index < content.length; index++) {
        const child = content[index];
        if (isRecord(child) && inlineTypes.has(String(child.type))) {
          if (inlineRun.length === 0) changedPaths.push(`${pathPrefix}.content.${index}`);
          inlineRun.push(child);
        } else {
          flushInlineRun();
          normalized.push(child);
        }
      }
      flushInlineRun();
      content = normalized;
    }

    copy.content = content;
  }
  return copy;
}

async function collect(): Promise<MigrationRecord[]> {
  const [projects, labs, articles, certificates] = await Promise.all([
    prisma.project.findMany({ select: { id: true, slug: true, title: true, content: true } }),
    prisma.lab.findMany({ select: { id: true, slug: true, title: true, content: true } }),
    prisma.article.findMany({ select: { id: true, slug: true, title: true, content: true } }),
    prisma.certificate.findMany({ select: { id: true, slug: true, name: true, content: true } }),
  ]);
  const rows = [
    ...projects.map((row) => ({ model: "Project" as const, ...row })),
    ...labs.map((row) => ({ model: "Lab" as const, ...row })),
    ...articles.map((row) => ({ model: "Article" as const, ...row })),
    ...certificates
      .filter((row): row is typeof row & { content: Prisma.JsonValue } => row.content !== null)
      .map((row) => ({ model: "Certificate" as const, ...row, title: row.name })),
  ];

  const migrations: MigrationRecord[] = [];
  for (const row of rows) {
    const changedPaths: string[] = [];
    const after = normalizeNode(row.content, "content", changedPaths);
    if (changedPaths.length === 0) continue;
    const result = tiptapDocSchema.safeParse(after);
    if (!result.success) {
      throw new Error(`Normalization did not produce valid TipTap JSON for ${row.model} ${row.slug}`);
    }
    migrations.push({
      model: row.model,
      id: row.id,
      slug: row.slug,
      title: row.title,
      before: row.content,
      after: result.data as Prisma.InputJsonValue,
      changedPaths,
    });
  }
  return migrations;
}

async function main() {
  const migrations = await collect();
  for (const record of migrations) {
    console.log(
      `[content-migration] ${record.model} id=${record.id} slug=${record.slug} paths=${record.changedPaths.slice(0, 5).join(",")}${record.changedPaths.length > 5 ? `,+${record.changedPaths.length - 5} more` : ""} change=wrap-inline-table-cell-content-in-paragraph`
    );
  }
  console.log(`[content-migration] mode=${writeMode ? "write" : "dry-run"} records=${migrations.length}`);
  if (!writeMode || migrations.length === 0) return;

  const backupDirectory = path.join(process.cwd(), "backups", "content-migrations");
  await mkdir(backupDirectory, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDirectory, `before-table-cell-normalization-${timestamp}.json`);
  await writeFile(
    backupPath,
    JSON.stringify(
      migrations.map(({ model, id, slug, title, before }) => ({ model, id, slug, title, content: before })),
      null,
      2
    ),
    "utf8"
  );

  await prisma.$transaction(
    migrations.map((record) => {
      const data = { content: record.after };
      switch (record.model) {
        case "Project":
          return prisma.project.update({ where: { id: record.id }, data });
        case "Lab":
          return prisma.lab.update({ where: { id: record.id }, data });
        case "Article":
          return prisma.article.update({ where: { id: record.id }, data });
        case "Certificate":
          return prisma.certificate.update({ where: { id: record.id }, data });
      }
    })
  );
  console.log(`[content-migration] updated=${migrations.length} backup=${path.relative(process.cwd(), backupPath)}`);
}

main()
  .catch((error) => {
    console.error(`[content-migration] failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
