import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/admin/article-form";
import { getArticleForEdit } from "@/lib/services/article-admin-service";
import { getAllMedia } from "@/lib/services/media-admin-service";

type ArticleEditParams = Promise<{ id: string }>;

export default async function EditArticlePage({ params }: { params: ArticleEditParams }) {
  const { id } = await params;
  const [article, media] = await Promise.all([getArticleForEdit(id), getAllMedia()]);
  if (!article) notFound();
  return (
    <ArticleForm
      mode="edit"
      media={media}
      article={{
        id: article.id, title: article.title, slug: article.slug, summary: article.summary,
        category: article.category?.name ?? "", publishStatus: article.publishStatus,
        tags: article.tags.map((t) => t.name), date: article.date.toISOString().slice(0, 10),
        scheduledFor: article.scheduledFor ? article.scheduledFor.toISOString().slice(0, 16) : "",
        content: article.content as never,
        downloads: article.downloads
          .filter((download) => download.mediaId)
          .map((download) => ({
            mediaId: download.mediaId!,
            label: download.label,
            description: download.description ?? "",
          })),
      }}
    />
  );
}
