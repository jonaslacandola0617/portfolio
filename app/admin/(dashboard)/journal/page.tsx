import Link from "next/link";
import { Plus, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/admin/empty-state";
import { getAllArticlesForAdmin } from "@/lib/services/article-admin-service";
import { formatDate } from "@/lib/utils";

const statusVariant = { DRAFT: "default", PUBLISHED: "success", ARCHIVED: "outline", SCHEDULED: "warning" } as const;

export default async function AdminJournalPage() {
  const articles = await getAllArticlesForAdmin();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">Journal</h1>
          <p className="mt-1 text-sm text-muted-foreground">{articles.length} total</p>
        </div>
        <Button asChild>
          <Link href="/admin/journal/new"><Plus className="h-4 w-4" /> New entry</Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <EmptyState icon={NotebookPen} title="No journal entries yet" description="Write your first entry to get started." />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {articles.map((a) => (
            <Link key={a.id} href={`/admin/journal/${a.id}`} className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-accent">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{a.title}</div>
                <div className="mt-0.5 font-mono text-[0.68rem] text-muted-foreground">
                  /{a.slug} · updated {formatDate(a.updatedAt.toISOString().slice(0, 10))}
                </div>
              </div>
              <Badge variant={statusVariant[a.publishStatus as keyof typeof statusVariant]}>{a.publishStatus}</Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
