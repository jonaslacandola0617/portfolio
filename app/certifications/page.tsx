import { PageHeader, PageShell } from "@/components/shared/page-header";
import { CertificateCard } from "@/components/shared/certificate-card";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "IT, Web Development, Networking & Cybersecurity Certifications",
  description:
    "Professional certifications and technical coursework completed by Jonas Lacandola across IT support, web development, networking, cybersecurity, Linux, and software development.",
  path: "/certifications",
  keywords: [
    "IT certifications",
    "web development certifications",
    "software development coursework",
    "Google IT Support certificate",
    "Google Cybersecurity certificate",
    "Cisco networking certifications",
    "CCNA coursework",
    "networking certifications",
  ],
});

export default async function CertificationsPage() {
  const certifications = await getAllCertificates();
  return (
    <div>
      <PageHeader
        index="05"
        eyebrow="Credentials"
        title="Certifications"
        description="Professional certifications and structured coursework, with the practical skills developed through each credential."
      />
      <PageShell>
        {certifications.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {certifications.map((certificate, index) => (
              <CertificateCard key={certificate.id} cert={certificate} index={index + 1} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-dim">No published certifications yet.</p>
        )}
      </PageShell>
    </div>
  );
}
