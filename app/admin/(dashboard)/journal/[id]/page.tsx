import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "@/components/admin/article-form";
import { getArticleForEdit } from "@/lib/services/article-admin-service";

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticleForEdit(params.id);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <Link href="/admin/journal" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to journal
      </Link>
      <h1 className="mb-6 font-display text-2xl font-semibold text-foreground">{article.title}</h1>
      <ArticleForm
        mode="edit"
        article={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          category: article.category?.name ?? "",
          publishStatus: article.publishStatus,
          tags: article.tags.map((t) => t.name),
          date: article.date.toISOString().slice(0, 10),
          scheduledFor: article.scheduledFor ? article.scheduledFor.toISOString().slice(0, 16) : "",
          content: article.content as never,
        }}
      />
    </div>
  );
}
