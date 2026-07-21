import "server-only";
import { prisma } from "@/lib/db";
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
    skills: cert.skills.map((s) => s.name),
    logo: cert.logo,
  };
}

export async function getCertificateCount(): Promise<number> {
  try {
    return await prisma.certificate.count();
  } catch (error) {
    console.error("[queries/certificates] getCertificateCount failed:", error);
    return 0;
  }
}

export async function getAllCertificates(): Promise<Certification[]> {
  try {
    const certs = (await prisma.certificate.findMany({
      where: { publishStatus: "PUBLISHED" },
      include: { skills: true },
      orderBy: { dateStarted: "asc" },
    })) as CertificateWithRelations[];
    return certs.map(mapCertificate);
  } catch (error) {
    console.error("[queries/certificates] getAllCertificates failed, returning empty list:", error);
    return [];
  }
}
