import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllCertificatesForAdmin } from "@/lib/services/certificate-admin-service";
import { formatDate } from "@/lib/utils";
import {
  deleteCertificateAction,
  bulkDeleteCertificatesAction,
  reorderCertificatesAction,
} from "@/app/admin/(dashboard)/certificates/actions";

export default async function AdminCertificatesPage() {
  const items = await getAllCertificatesForAdmin();
  const rows: ManagementListRow[] = items.map((c) => ({
    id: c.id,
    title: c.name,
    meta: c.issuer,
    status: c.publishStatus,
    updated: formatDate(c.updatedAt.toISOString().slice(0, 10)),
  }));

  return (
    <ManagementList
      index="04"
      title="Certificates"
      eyebrow="Display credentials and certifications."
      rows={rows}
      basePath="/admin/certificates"
      newHref="/admin/certificates/new"
      itemLabelSingular="certificate"
      itemLabelPlural="certificates"
      deleteOneAction={deleteCertificateAction}
      deleteManyAction={bulkDeleteCertificatesAction}
      reorderAction={reorderCertificatesAction}
    />
  );
}
