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
  logoMedia: { url: string } | null;
  dateStarted: Date | null;
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
    dateStarted: cert.dateStarted ? toISODate(cert.dateStarted) : undefined,
    dateCompleted: cert.dateCompleted ? toISODate(cert.dateCompleted) : undefined,
    credentialUrl: cert.credentialUrl ?? undefined,
    skills: cert.skills.map((skill) => skill.name),
    logo: cert.logo,
    logoUrl: cert.logoMedia?.url,
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
      include: { skills: true, logoMedia: { select: { url: true } } },
      orderBy: [{ dateCompleted: "desc" }, { name: "asc" }],
    })) as CertificateWithRelations[];
    return certificates.map(mapCertificate);
  })
);
