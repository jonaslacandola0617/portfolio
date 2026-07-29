import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CertificateForm } from "@/components/admin/certificate-form";
import { getCertificateForEdit } from "@/lib/services/certificate-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function EditCertificatePage({
  params,
}: {
  params: { id: string };
}) {
  const [certificate, media] = await Promise.all([
    getCertificateForEdit(params.id),
    getAllMedia(),
  ]);
  if (!certificate) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <Link
        href="/admin/certificates"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to certificates
      </Link>
      <CertificateForm
        mode="edit"
        media={media}
        certificate={{
          id: certificate.id,
          name: certificate.name,
          slug: certificate.slug,
          issuer: certificate.issuer,
          logoMediaId: certificate.logoMediaId ?? "",
          publishStatus: certificate.publishStatus,
          skills: certificate.skills.map((s) => s.name),
          dateStarted: certificate.dateStarted
            ? certificate.dateStarted.toISOString().slice(0, 10)
            : "",
          dateCompleted: certificate.dateCompleted
            ? certificate.dateCompleted.toISOString().slice(0, 10)
            : "",
          credentialUrl: certificate.credentialUrl ?? "",
          scheduledFor: certificate.scheduledFor
            ? certificate.scheduledFor.toISOString().slice(0, 16)
            : "",
          content: (certificate.content ?? {
            type: "doc",
            content: [{ type: "paragraph" }],
          }) as never,
        }}
      />
    </div>
  );
}
