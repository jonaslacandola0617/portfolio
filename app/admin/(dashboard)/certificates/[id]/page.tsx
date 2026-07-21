import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CertificateForm } from "@/components/admin/certificate-form";
import { getCertificateForEdit } from "@/lib/services/certificate-admin-service";

export default async function EditCertificatePage({ params }: { params: { id: string } }) {
  const certificate = await getCertificateForEdit(params.id);
  if (!certificate) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <Link href="/admin/certificates" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to certificates
      </Link>
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">{certificate.name}</h1>
      <CertificateForm
        mode="edit"
        certificate={{
          id: certificate.id,
          name: certificate.name,
          slug: certificate.slug,
          issuer: certificate.issuer,
          logo: certificate.logo,
          progressStatus: certificate.progressStatus,
          publishStatus: certificate.publishStatus,
          progressLabel: certificate.progressLabel,
          progressPercent: certificate.progressPercent,
          skills: certificate.skills.map((s) => s.name),
          dateStarted: certificate.dateStarted.toISOString().slice(0, 10),
          dateCompleted: certificate.dateCompleted ? certificate.dateCompleted.toISOString().slice(0, 10) : "",
          credentialUrl: certificate.credentialUrl ?? "",
          scheduledFor: certificate.scheduledFor ? certificate.scheduledFor.toISOString().slice(0, 16) : "",
          content: (certificate.content ?? { type: "doc", content: [{ type: "paragraph" }] }) as never,
        }}
      />
    </div>
  );
}
