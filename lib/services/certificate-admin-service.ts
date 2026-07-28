import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { CertificateFormValues } from "@/lib/validations/certificate";
import type { TipTapDoc } from "@/types/tiptap";

import { emptyTemplate } from "@/lib/editor/templates";
import { toPrismaJson } from "@/lib/prisma-json";
import { revalidateContent } from "@/lib/services/content-revalidation";
import { skillRelationInput } from "@/lib/services/skill-relations";

interface AdminCertificateListItem {
  id: string;
  name: string;
  slug: string;
  publishStatus: string;
  updatedAt: Date;
}

interface AdminCertificateDetail {
  id: string;
  name: string;
  slug: string;
  issuer: string;
  logo: string;
  content: unknown;
  progressStatus: string;
  publishStatus: string;
  progressLabel: string;
  progressPercent: number;
  skills: { name: string }[];
  dateStarted: Date;
  dateCompleted: Date | null;
  credentialUrl: string | null;
  scheduledFor: Date | null;
}

export async function getAllCertificatesForAdmin(): Promise<AdminCertificateListItem[]> {
  return prisma.certificate.findMany({ orderBy: { updatedAt: "desc" } }) as Promise<
    AdminCertificateListItem[]
  >;
}

export async function getCertificateForEdit(id: string): Promise<AdminCertificateDetail | null> {
  return prisma.certificate.findUnique({
    where: { id },
    include: { skills: true },
  }) as Promise<AdminCertificateDetail | null>;
}

export async function createCertificate(fm: CertificateFormValues) {
  const skills = await skillRelationInput(fm.skills, { group: "Cybersecurity", level: "practiced" });
  const cert = await prisma.certificate.create({
    data: {
      name: fm.name,
      slug: fm.slug,
      issuer: fm.issuer,
      logo: fm.logo,
      progressStatus: fm.progressStatus,
      publishStatus: fm.publishStatus,
      progressLabel: fm.progressLabel,
      progressPercent: fm.progressPercent,
      dateStarted: new Date(fm.dateStarted),
      dateCompleted: fm.dateCompleted ? new Date(fm.dateCompleted) : null,
      credentialUrl: fm.credentialUrl || null,
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      publishedAt: fm.publishStatus === "PUBLISHED" ? new Date() : null,
      content: toPrismaJson(emptyTemplate),
      skills,
    },
  });
  revalidateContent("certificate");
  return cert;
}

export async function updateCertificateMetadata(id: string, fm: CertificateFormValues) {
  const existing = await prisma.certificate.findUnique({ where: { id }, select: { publishStatus: true } });
  const skills = await skillRelationInput(fm.skills, { group: "Cybersecurity", level: "practiced" });

  const cert = await prisma.certificate.update({
    where: { id },
    data: {
      name: fm.name,
      slug: fm.slug,
      issuer: fm.issuer,
      logo: fm.logo,
      progressStatus: fm.progressStatus,
      publishStatus: fm.publishStatus,
      progressLabel: fm.progressLabel,
      progressPercent: fm.progressPercent,
      dateStarted: new Date(fm.dateStarted),
      dateCompleted: fm.dateCompleted ? new Date(fm.dateCompleted) : null,
      credentialUrl: fm.credentialUrl || null,
      scheduledFor: fm.scheduledFor ? new Date(fm.scheduledFor) : null,
      ...(fm.publishStatus === "PUBLISHED" && existing?.publishStatus !== "PUBLISHED"
        ? { publishedAt: new Date() }
        : {}),
      skills: { set: [], ...skills },
    },
  });

  revalidateContent("certificate");
  return cert;
}

export async function updateCertificateContent(id: string, content: TipTapDoc) {
  const cert = await prisma.certificate.update({
    where: { id },
    data: { content: toPrismaJson(content) },
    select: { publishStatus: true },
  });
  if (cert.publishStatus === "PUBLISHED") revalidateContent("certificate");
  const readBack = await prisma.certificate.findUnique({ where: { id }, select: { content: true } });
  return readBack?.content;
}

export async function deleteCertificate(id: string) {
  await prisma.certificate.delete({ where: { id } });
  revalidateContent("certificate");
}

/** Bulk delete for the management page's checkbox selection. No slugs
 *  to revalidate per-record (certificates have no individual public
 *  detail route — see revalidateCertificatePaths). */
export async function deleteCertificates(ids: string[]): Promise<number> {
  const count = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.certificate.findMany({ where: { id: { in: ids } }, select: { id: true } });
    await tx.certificate.deleteMany({ where: { id: { in: ids } } });
    return records.length;
  });

  revalidateContent("certificate");
  return count;
}
