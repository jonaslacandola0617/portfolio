import { PageHeader, PageShell } from "@/components/shared/page-header";
import { CertificateCard } from "@/components/shared/certificate-card";
import { getAllCertificates } from "@/lib/db/queries/certificates";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "IT, Networking & Cybersecurity Certifications",
  description:
    "Verified certificates by Jonas Lacandola: Google Cybersecurity, Cisco Network Technician Career Path, CCNA courses and IT Essentials, each with a link to check it.",
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
  const completed = certifications.filter((cert) => cert.dateCompleted).length;
  return (
    <div>
      <PageHeader
        index="Certificates"
        eyebrow={`${completed} completed`}
        title="Training I've completed."
        description="Each certificate links to the issuer's page so you can verify it. Open one to see what it covered."
      />
      <PageShell>
        {certifications.length ? (
          <ol className="cert-list cert-list-full">
            {certifications.map((certificate) => <CertificateCard key={certificate.id} cert={certificate} />)}
          </ol>
        ) : (
          <p className="muted">No published certificates yet.</p>
        )}
      </PageShell>
    </div>
  );
}
