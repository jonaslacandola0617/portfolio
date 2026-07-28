import { getRevalidationTargets, type RevalidationContentType } from "@/lib/revalidation-targets";

const expectations: Record<RevalidationContentType, string[]> = {
  project: ["/admin", "/admin/projects", "/projects", "/projects/old", "/projects/new", "/tags/[tag]", "/sitemap.xml", "/"],
  lab: ["/admin", "/admin/labs", "/labs", "/labs/old", "/labs/new", "/tags/[tag]", "/sitemap.xml", "/"],
  article: ["/admin", "/admin/journal", "/journal", "/journal/old", "/journal/new", "/tags/[tag]", "/sitemap.xml", "/"],
  certificate: ["/admin", "/admin/certificates", "/certifications", "/sitemap.xml", "/"],
  timeline: ["/admin", "/admin/timeline", "/timeline"],
  skill: ["/admin", "/admin/skills", "/skills", "/projects"],
  settings: ["/admin/settings", "/", "/about", "/contact", "/resume"],
  media: ["/admin/media"],
};

for (const contentType of Object.keys(expectations) as RevalidationContentType[]) {
  const paths = getRevalidationTargets(contentType, ["old", "new"]).map((target) => target.path);
  for (const expected of expectations[contentType]) {
    if (!paths.includes(expected)) throw new Error(`${contentType} is missing revalidation target ${expected}`);
  }
  console.log(`[revalidation] ${contentType}: ${paths.join(", ")}`);
}

console.log("[revalidation] matrix=ok");
