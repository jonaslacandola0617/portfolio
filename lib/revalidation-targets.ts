export type RevalidationContentType =
  | "project"
  | "lab"
  | "article"
  | "certificate"
  | "skill"
  | "settings"
  | "media";

export type RevalidationTarget = { path: string; type?: "layout" | "page" };

const collectionTargets: Record<RevalidationContentType, RevalidationTarget[]> = {
  project: [
    { path: "/admin" }, { path: "/admin/projects" }, { path: "/projects" },
    { path: "/tags/[tag]", type: "page" }, { path: "/sitemap.xml" }, { path: "/", type: "layout" },
  ],
  lab: [
    { path: "/admin" }, { path: "/admin/labs" }, { path: "/labs" },
    { path: "/tags/[tag]", type: "page" }, { path: "/sitemap.xml" }, { path: "/", type: "layout" },
  ],
  article: [
    { path: "/admin" }, { path: "/admin/journal" }, { path: "/journal" },
    { path: "/tags/[tag]", type: "page" }, { path: "/sitemap.xml" }, { path: "/", type: "layout" },
  ],
  certificate: [
    { path: "/admin" }, { path: "/admin/certificates" }, { path: "/certifications" },
    { path: "/sitemap.xml" }, { path: "/", type: "layout" },
  ],
  skill: [{ path: "/admin" }, { path: "/admin/skills" }, { path: "/projects" }],
  settings: [
    { path: "/admin/settings" }, { path: "/admin/about" }, { path: "/" }, { path: "/about" }, { path: "/contact" },
    { path: "/resume" }, { path: "/", type: "layout" },
  ],
  media: [{ path: "/admin/media" }],
};

const detailBase: Partial<Record<RevalidationContentType, string>> = {
  project: "/projects",
  lab: "/labs",
  article: "/journal",
};

export function getRevalidationTargets(
  contentType: RevalidationContentType,
  slugs: string[] = []
): RevalidationTarget[] {
  const base = detailBase[contentType];
  const details: RevalidationTarget[] = base
    ? [...new Set(slugs.filter(Boolean))].map((slug) => ({ path: `${base}/${slug}` }))
    : [];
  const unique = new Map<string, RevalidationTarget>();
  for (const target of [...collectionTargets[contentType], ...details]) {
    unique.set(`${target.path}:${target.type ?? "page"}`, target);
  }
  return [...unique.values()];
}
