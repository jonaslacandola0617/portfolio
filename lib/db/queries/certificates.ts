import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { readWithPolicy } from "@/lib/db/read-policy";
import type { Certification } from "@/types";

interface CertificateWithRelations {
  slug: string;
  name: string;
  issuer: string;
  logo: string;
  progressStatus: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  progressLabel: string;
  progressPercent: number;
  dateStarted: Date;
  dateCompleted: Date | null;
  credentialUrl: string | null;
  skills: { name: string }[];
  content: unknown;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function mapCertificate(cert: CertificateWithRelations): Certification {
  return {
    id: cert.slug,
    name: cert.name,
    issuer: cert.issuer,
    status: cert.progressStatus.toLowerCase().replace("_", "-") as Certification["status"],
    progressLabel: cert.progressLabel,
    progressPercent: cert.progressPercent,
    dateStarted: toISODate(cert.dateStarted),
    dateCompleted: cert.dateCompleted ? toISODate(cert.dateCompleted) : undefined,
    credentialUrl: cert.credentialUrl ?? undefined,
    skills: cert.skills.map((skill) => skill.name),
    logo: cert.logo,
    content: cert.content ?? undefined,
  };
}

export const getCertificateCount = cache(async (): Promise<number> =>
  readWithPolicy("certificates.getCertificateCount", 0, () => prisma.certificate.count())
);

export const getAllCertificates = cache(async (): Promise<Certification[]> =>
  readWithPolicy("certificates.getAllCertificates", [], async () => {
    const certificates = (await prisma.certificate.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { skills: true },
      orderBy: { dateStarted: "asc" },
    })) as CertificateWithRelations[];
    return certificates.map(mapCertificate);
  })
);
