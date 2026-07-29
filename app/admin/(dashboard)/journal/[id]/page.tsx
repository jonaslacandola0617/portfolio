import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/admin/article-form";
import { getArticleForEdit } from "@/lib/services/article-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const [article, media] = await Promise.all([
    getArticleForEdit(params.id),
    getAllMedia(),
  ]);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
      <Link
        href="/admin/journal"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to journal
      </Link>
      <ArticleForm
        mode="edit"
        media={media}
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          category: article.category?.name ?? "",
          publishStatus: article.publishStatus,
          tags: article.tags.map((t) => t.name),
          date: article.date.toISOString().slice(0, 10),
          scheduledFor: article.scheduledFor
            ? article.scheduledFor.toISOString().slice(0, 16)
            : "",
          content: article.content as never,
        }}
      />
    </div>
  );
}
