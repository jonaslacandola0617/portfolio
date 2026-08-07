import { PrismaClient } from "@prisma/client";
import { cleanSkillGroup, isUngroupedSkillGroup, skillGroupKey } from "../lib/skill-groups";
import { certificateFormSchema } from "../lib/validations/certificate";

const prisma = new PrismaClient();
const prefix = "codex-requested-audit-";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function databaseSchema(): string {
  const url = new URL(process.env.DATABASE_URL ?? "");
  return url.searchParams.get("schema") ?? "public";
}

async function main() {
  const schema = databaseSchema();
  const readOnly = process.env.AUDIT_READ_ONLY === "1";

  assert(cleanSkillGroup("") === "Ungrouped", "Blank Skill groups must normalize to Ungrouped.");
  assert(cleanSkillGroup("  untagged ") === "Ungrouped", "Untagged alias must normalize to Ungrouped.");
  assert(skillGroupKey(" Web   Development ") === skillGroupKey("web development"), "Skill group keys must ignore case and repeated whitespace.");
  assert(isUngroupedSkillGroup("UNGROUPED"), "Ungrouped matching must be case-insensitive.");

  const validCertificate = certificateFormSchema.safeParse({
    name: "Audit Certificate",
    slug: "audit-certificate",
    issuer: "Audit Issuer",
    logoMediaId: "",
    publishStatus: "DRAFT",
    skills: [],
    dateStarted: "",
    dateCompleted: "2026-07-28",
    credentialUrl: "",
    scheduledFor: "",
  });
  assert(validCertificate.success, "Certificate validation must accept an omitted Start Date.");
  assert(
    !certificateFormSchema.safeParse({
      ...validCertificate.data,
      dateCompleted: "__incomplete_date__",
    }).success,
    "Certificate validation must reject incomplete dates."
  );

  const [projects, labs, articles, certificates, incompatibleCertificates, skillGroups] = await Promise.all([
    prisma.project.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.lab.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.article.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.certificate.count({ where: { publishStatus: "PUBLISHED" } }),
    prisma.certificate.count({
      where: {
        OR: [
          { progressStatus: { not: "COMPLETED" } },
          { progressLabel: { not: "Completed" } },
          { progressPercent: { not: 100 } },
        ],
      },
    }),
    prisma.skill.findMany({ select: { group: true } }),
  ]);
  assert(incompatibleCertificates === 0, "All managed Certificates must use completed-only compatibility values.");
  const groupNames = new Map<string, string>();
  for (const row of skillGroups) {
    const key = skillGroupKey(row.group);
    const existing = groupNames.get(key);
    assert(!existing || existing === row.group, `Duplicate Skill group capitalization/spacing found: ${existing} / ${row.group}`);
    groupNames.set(key, row.group);
  }
  console.log(`[requested-audit] schema=${schema} published projects=${projects} labs=${labs} articles=${articles} certificates=${certificates}`);

  if (readOnly) {
    console.log("[requested-audit] production read-only checks passed.");
    return;
  }

  assert(schema !== "public", "Write verification refuses to run against the production public schema.");
  assert(process.env.ALLOW_AUDIT_WRITES === "1", "Set ALLOW_AUDIT_WRITES=1 for the isolated audit schema.");

  const skillName = `${prefix}${Date.now()}`;
  const certificateSlug = `${prefix}${Date.now()}`;
  let skillId: string | undefined;
  let certificateId: string | undefined;
  let mediaId: string | undefined;
  try {
    const skill = await prisma.skill.create({
      data: { name: skillName, level: "learning" },
      select: { id: true, group: true },
    });
    skillId = skill.id;
    assert(skill.group === "Ungrouped", "Database default for a new Skill must be Ungrouped.");

    const certificate = await prisma.certificate.create({
      data: {
        slug: certificateSlug,
        name: "Audit Certificate",
        issuer: "Audit Issuer",
        publishStatus: "DRAFT",
      },
      select: {
        id: true,
        dateStarted: true,
        progressStatus: true,
        progressLabel: true,
        progressPercent: true,
      },
    });
    certificateId = certificate.id;
    assert(certificate.dateStarted === null, "Certificate Start Date must be nullable.");
    assert(certificate.progressStatus === "COMPLETED", "Compatibility status must default to COMPLETED.");
    assert(certificate.progressLabel === "Completed" && certificate.progressPercent === 100, "Compatibility progress fields must use completed-only defaults.");

    const media = await prisma.media.create({
      data: {
        url: `https://requested-audit.public.blob.vercel-storage.com/${certificateSlug}.png`,
        filename: `${certificateSlug}.png`,
        type: "IMAGE",
        size: 128,
      },
      select: { id: true },
    });
    mediaId = media.id;
    await prisma.certificate.update({ where: { id: certificate.id }, data: { logoMediaId: media.id } });
    const linked = await prisma.certificate.findUnique({ where: { id: certificate.id }, select: { logoMediaId: true } });
    assert(linked?.logoMediaId === media.id, "Certificate must retain its selected Media logo.");
    await prisma.certificate.update({ where: { id: certificate.id }, data: { logoMediaId: null } });
    assert(await prisma.media.findUnique({ where: { id: media.id }, select: { id: true } }), "Removing a Certificate logo association must not delete the Media record.");

    console.log("[requested-audit] Skill normalization, optional dates, completed-only Certificate defaults, and Media logo association passed.");
  } finally {
    if (certificateId) await prisma.certificate.deleteMany({ where: { id: certificateId } });
    if (mediaId) await prisma.media.deleteMany({ where: { id: mediaId } });
    if (skillId) await prisma.skill.deleteMany({ where: { id: skillId } });
  }
}

main()
  .catch((error) => {
    console.error(`[requested-audit] failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
