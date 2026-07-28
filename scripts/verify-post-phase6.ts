import { PrismaClient } from "@prisma/client";
import { isDeepStrictEqual } from "node:util";
import {
  articleTemplates,
  labTemplates,
  projectTemplates,
  templateCatalog,
} from "../lib/editor/templates";
import { aboutPageSchema } from "../lib/validations/about";
import { validateTipTapDoc } from "../lib/validations/content";
import { toPrismaJson } from "../lib/prisma-json";

const prisma = new PrismaClient();

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function headings(document: unknown): string[] {
  const parsed = validateTipTapDoc(document);
  assert(parsed.success, "Template document failed the TipTap schema.");
  return parsed.data.content
    .filter((node) => node.type === "heading")
    .map((node) =>
      node.content
        ?.map((child: { type: string; text?: string }) => (child.type === "text" ? child.text ?? "" : ""))
        .join("") ?? ""
    );
}

function verifyTemplates() {
  assert(projectTemplates.length === 6, "Project catalog must contain Blank plus five templates.");
  assert(articleTemplates.length === 6, "Article catalog must contain Blank plus five templates.");
  assert(labTemplates.length === 5, "Lab catalog must contain Blank plus four focused templates.");
  assert(!labTemplates.some((item) => /web|software/i.test(item.name)), "Lab catalog contains an irrelevant template.");

  const ids = new Set<string>();
  for (const item of templateCatalog) {
    assert(!ids.has(item.id), `Duplicate template id: ${item.id}`);
    ids.add(item.id);
    const parsed = validateTipTapDoc(item.document);
    assert(parsed.success, `Invalid template document: ${item.id}`);
    assert(
      JSON.stringify(headings(item.document)) === JSON.stringify(item.sections),
      `Template headings do not match the catalog: ${item.id}`
    );
    if (item.sections.length === 0) {
      assert(parsed.data.content.length === 1 && parsed.data.content[0]?.type === "paragraph", `${item.id} is not blank.`);
    }
  }
}

async function verifyDatabase() {
  const [settings, projects, labs, articles, certificates] = await Promise.all([
    prisma.siteSettings.findFirst({ select: { aboutPage: true } }),
    prisma.project.findMany({ select: { id: true, content: true } }),
    prisma.lab.findMany({ select: { id: true, content: true } }),
    prisma.article.findMany({ select: { id: true, content: true } }),
    prisma.certificate.findMany({ select: { id: true, content: true } }),
  ]);

  assert(settings, "SiteSettings singleton is missing.");
  assert(aboutPageSchema.safeParse(settings.aboutPage).success, "SiteSettings.aboutPage is invalid.");

  const collections = [
    ["Project", projects],
    ["Lab", labs],
    ["Article", articles],
    ["Certificate", certificates],
  ] as const;
  for (const [model, rows] of collections) {
    for (const row of rows) {
      if (model === "Certificate" && row.content == null) continue;
      assert(validateTipTapDoc(row.content).success, `${model} ${row.id} has invalid TipTap content.`);
    }
  }

  console.log(
    `[post-phase6] templates=${templateCatalog.length} about=valid content=${projects.length + labs.length + articles.length + certificates.length}`
  );
}

async function runReversibleMutationFixture() {
  const [project, lab, image, packetTracer, pcap] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: "post-phase-6-template-browser-test" },
      select: { id: true, content: true },
    }),
    prisma.lab.findFirst({
      where: { publishStatus: "PUBLISHED" },
      select: {
        id: true,
        downloads: {
          orderBy: { sortOrder: "asc" },
          select: {
            label: true,
            url: true,
            type: true,
            description: true,
            sortOrder: true,
            mediaId: true,
          },
        },
      },
    }),
    prisma.media.findFirst({ where: { filename: "codex-post-phase6-audit.png" } }),
    prisma.media.findFirst({ where: { filename: "codex-post-phase6-audit.pkt" } }),
    prisma.media.findFirst({ where: { filename: "codex-post-phase6-audit.pcap" } }),
  ]);
  assert(project && lab && image && packetTracer && pcap, "Reversible audit fixtures are incomplete.");

  const originalProjectContent = project.content;
  const originalDownloads = lab.downloads;
  const document = {
    type: "doc" as const,
    content: [
      {
        type: "mediaImage" as const,
        attrs: {
          mediaId: image.id,
          src: image.url,
          alt: "Phase 6 media insertion verification",
          caption: "Media Library insertion verified in the isolated audit environment.",
          alignment: "center" as const,
          size: "large" as const,
        },
      },
      {
        type: "mediaAttachment" as const,
        attrs: {
          mediaId: packetTracer.id,
          url: packetTracer.url,
          displayName: "Packet Tracer audit fixture",
          description: "Temporary attachment used to verify persisted editor downloads.",
          fileType: "PACKET_TRACER" as const,
          fileSize: packetTracer.size,
        },
      },
      ...projectTemplates.find((item) => item.id === "project-networking")!.document.content,
    ],
  };
  assert(validateTipTapDoc(document).success, "Combined image and attachment fixture is invalid.");

  try {
    await prisma.project.update({
      where: { id: project.id },
      data: { content: toPrismaJson(document) },
    });
    const readBack = await prisma.project.findUnique({ where: { id: project.id }, select: { content: true } });
    assert(isDeepStrictEqual(readBack?.content, document), "Project media document read-back mismatch.");

    await prisma.$transaction(async (tx) => {
      await tx.download.deleteMany({ where: { labId: lab.id } });
      await tx.download.createMany({
        data: [
          {
            labId: lab.id,
            mediaId: pcap.id,
            label: "Audit packet capture",
            description: "Second before reordering.",
            sortOrder: 1,
            url: pcap.url,
            type: "pcap",
          },
          {
            labId: lab.id,
            mediaId: packetTracer.id,
            label: "Audit Packet Tracer lab",
            description: "First after ordering.",
            sortOrder: 0,
            url: packetTracer.url,
            type: "packet-tracer",
          },
        ],
      });
    });
    const resources = await prisma.download.findMany({
      where: { labId: lab.id },
      orderBy: { sortOrder: "asc" },
      select: { mediaId: true },
    });
    assert(
      resources[0]?.mediaId === packetTracer.id && resources[1]?.mediaId === pcap.id,
      "Lab resource ordering failed."
    );
    console.log("[post-phase6] reversible media and Lab resource mutation fixture passed");
  } finally {
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: project.id },
        data: { content: toPrismaJson(originalProjectContent) },
      });
      await tx.download.deleteMany({ where: { labId: lab.id } });
      if (originalDownloads.length) {
        await tx.download.createMany({
          data: originalDownloads.map((item) => ({
            ...item,
            labId: lab.id,
          })),
        });
      }
    });
    const retained = await prisma.media.count({
      where: { id: { in: [packetTracer.id, pcap.id] } },
    });
    assert(retained === 2, "Removing Lab associations deleted shared Media.");
  }
}

async function main() {
  verifyTemplates();
  await verifyDatabase();
  if (process.env.POST_PHASE6_MUTATION_TEST === "1") {
    await runReversibleMutationFixture();
  }
}

main()
  .catch((error) => {
    console.error(`[post-phase6] verification failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
