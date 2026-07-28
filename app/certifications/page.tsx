import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { CertificateCard } from "@/components/shared/certificate-card";
import { getAllCertificates } from "@/lib/db/queries/certificates";

export const metadata: Metadata = { title: "Certifications" };

export default async function CertificationsPage() {
  const certifications = await getAllCertificates();

  return (
    <div className="mx-auto max-w-3xl px-6 py-14 md:px-10">
      <PageHeader
        eyebrow="Certifications"
        title="Certifications"
        description="Completed credentials and the practical skills developed through each certification."
      />

      {certifications.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published certifications yet.</p>
      ) : (
        <div className="space-y-4">
          {certifications.map((cert) => (
            <CertificateCard key={cert.id} cert={cert} />
          ))}
        </div>
      )}
    </div>
  );
}
