import Link from "next/link";
import { Plus, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getAllLabsForAdmin } from "@/lib/services/lab-admin-service";
import { formatDate } from "@/lib/utils";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminLabsPage() {
  const labs = await getAllLabsForAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Labs</h1>
          <p className="mt-1 text-sm text-muted-foreground">{labs.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/labs/new"><Plus className="h-4 w-4" /> New lab</Link>
        </Button>
      </div>

      {labs.length === 0 ? (
        <EmptyState icon={FlaskConical} title="No labs yet" description="Log your first lab to get started." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {labs.map((l) => (
            <Link key={l.id} href={`/admin/labs/${l.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{l.title}</div>
                <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                  /{l.slug} · updated {formatDate(l.updatedAt.toISOString().slice(0, 10))}
                </div>
              </div>
              <Badge variant={statusVariant[l.publishStatus as keyof typeof statusVariant]}>{l.publishStatus}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
