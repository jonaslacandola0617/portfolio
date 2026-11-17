import { HomepageEditor } from "@/components/admin/homepage-editor";
import { getHomepageContent } from "@/lib/db/queries/homepage";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { defaultHomepage } from "@/lib/homepage-defaults";
import { prisma } from "@/lib/db";

export default async function AdminHomepagePage() {
  const [content, settings, counts] = await Promise.all([
    getHomepageContent(),
    getSiteSettings(),
    Promise.all([
      prisma.lab.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.certificate.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.article.count({ where: { publishStatus: "PUBLISHED" } }),
      prisma.project.count({ where: { publishStatus: "PUBLISHED", aiAssisted: true } }),
    ]),
  ]);
  const [labs, certificates, articles, aiAssistedProjects] = counts;

  return (
    <HomepageEditor
      initial={content}
      defaults={defaultHomepage}
      context={{
        labs,
        certificates,
        articles,
        aiAssistedProjects,
        featuredProjects: settings.homepageProjectIds.length,
      }}
    />
  );
}
