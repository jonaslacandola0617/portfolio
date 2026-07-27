import Link from "next/link";
import { Plus, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/admin/empty-state";
import { ManagementList, type ManagementListRow } from "@/components/admin/management-list";
import { getAllCertificatesForAdmin } from "@/lib/services/certificate-admin-service";
import { formatDate } from "@/lib/utils";
import { deleteCertificateAction, bulkDeleteCertificatesAction } from "./actions";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminCertificatesPage() {
  const certificates = await getAllCertificatesForAdmin();

  const rows: ManagementListRow[] = certificates.map((c) => ({
    id: c.id,
    title: c.name,
    subtitle: `${c.slug} · updated ${formatDate(c.updatedAt.toISOString().slice(0, 10))}`,
    badgeLabel: c.publishStatus,
    badgeVariant: statusVariant[c.publishStatus as keyof typeof statusVariant],
  }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">{certificates.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/certificates/new"><Plus className="h-4 w-4" /> New certificate</Link>
        </Button>
      </div>

      {certificates.length === 0 ? (
        <EmptyState icon={BadgeCheck} title="No certificates yet" description="Add your first certification to get started." />
      ) : (
        <ManagementList
          rows={rows}
          basePath="/admin/certificates"
          itemLabelSingular="certificate"
          itemLabelPlural="certificates"
          deleteOneAction={deleteCertificateAction}
          deleteManyAction={bulkDeleteCertificatesAction}
        />
      )}
    </div>
  );
}
