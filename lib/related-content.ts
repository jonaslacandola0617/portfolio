import "server-only";
import { getAllArticles, getAllLabs, getAllProjects } from "@/lib/content";

export interface RelatedContentItem {
  type: "Project" | "Lab" | "Journal";
  title: string;
  href: string;
  summary: string;
  score: number;
}

function relevanceScore(
  candidateTags: string[],
  candidateCategory: string,
  tags: Set<string>,
  category: string,
) {
  const sharedTags = candidateTags.filter((tag) => tags.has(tag.toLowerCase())).length;
  const categoryMatch = candidateCategory.toLowerCase() === category.toLowerCase();
  return sharedTags * 3 + (categoryMatch ? 2 : 0);
}

export async function getRelatedContent({
  currentPath,
  tags,
  category,
  limit = 3,
}: {
  currentPath: string;
  tags: string[];
  category: string;
  limit?: number;
}): Promise<RelatedContentItem[]> {
  const [projects, labs, articles] = await Promise.all([
    getAllProjects(),
    getAllLabs(),
    getAllArticles(),
  ]);
  const normalizedTags = new Set(tags.map((tag) => tag.toLowerCase()));

  const candidates: RelatedContentItem[] = [
    ...projects.map((project) => ({
      type: "Project" as const,
      title: project.frontmatter.title,
      href: `/projects/${project.frontmatter.slug}`,
      summary: project.frontmatter.summary,
      score: relevanceScore(
        project.frontmatter.tags,
        project.frontmatter.category,
        normalizedTags,
        category,
      ),
    })),
    ...labs.map((lab) => ({
      type: "Lab" as const,
      title: lab.frontmatter.title,
      href: `/labs/${lab.frontmatter.slug}`,
      summary: lab.frontmatter.purpose,
      score: relevanceScore(
        lab.frontmatter.tags,
        lab.frontmatter.category,
        normalizedTags,
        category,
      ),
    })),
    ...articles.map((article) => ({
      type: "Journal" as const,
      title: article.frontmatter.title,
      href: `/journal/${article.frontmatter.slug}`,
      summary: article.frontmatter.summary,
      score: relevanceScore(
        article.frontmatter.tags,
        article.frontmatter.category,
        normalizedTags,
        category,
      ),
    })),
  ];

  return candidates
    .filter((candidate) => candidate.href !== currentPath && candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit);
}
