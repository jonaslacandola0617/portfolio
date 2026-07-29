import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CertificateForm } from "@/components/admin/certificate-form";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function NewCertificatePage() {
  const media = await getAllMedia();
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <Link href="/admin/certificates" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to certificates
      </Link>
      <h1 className="font-display text-2xl font-semibold text-foreground">New certificate</h1>
      <p className="mb-6 mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
        Add a completed credential and control the issuer information, dates,
        logo, verification link, and public visibility.
      </p>
      <CertificateForm mode="create" media={media} />
    </div>
  );
}
