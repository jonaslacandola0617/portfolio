import Link from "next/link";
import { Plus, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getAllCertificatesForAdmin } from "@/lib/services/certificate-admin-service";
import { formatDate } from "@/lib/utils";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminCertificatesPage() {
  const certificates = await getAllCertificatesForAdmin();

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
        <div className="divide-y divide-border rounded-lg border border-border">
          {certificates.map((c) => (
            <Link key={c.id} href={`/admin/certificates/${c.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{c.name}</div>
                <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                  {c.slug} · updated {formatDate(c.updatedAt.toISOString().slice(0, 10))}
                </div>
              </div>
              <Badge variant={statusVariant[c.publishStatus as keyof typeof statusVariant]}>{c.publishStatus}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
