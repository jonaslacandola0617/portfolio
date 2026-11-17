import "server-only";
import { prisma } from "@/lib/db";
import { getAboutPage } from "@/lib/db/queries/about";

export type HealthLevel = "ok" | "fix" | "tip";

export interface HealthCheck {
  id: string;
  level: HealthLevel;
  title: string;
  detail: string;
  href: string;
  action: string;
  /** Up to a few items that need attention, each linking to its editor. */
  items?: { label: string; href: string }[];
}

const list = <T,>(rows: T[], toItem: (row: T) => { label: string; href: string }) => rows.slice(0, 5).map(toItem);

/**
 * Plain-language checks on what a hiring manager will see. Ordered so that
 * problems come first, then suggestions, then what is already in good shape.
 */
export async function getContentHealth(): Promise<HealthCheck[]> {
  const published = { publishStatus: "PUBLISHED" as const };
  const [settings, about, certsMissingLink, projectsMissingImage, labs, labsMissingTags, drafts] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "singleton" }, select: { resumeUrl: true, homepageProjectIds: true, homepage: true } }),
    getAboutPage(),
    prisma.certificate.findMany({ where: { ...published, OR: [{ credentialUrl: null }, { credentialUrl: "" }] }, select: { id: true, name: true } }),
    prisma.project.findMany({ where: { ...published, thumbnailId: null }, select: { id: true, title: true } }),
    prisma.lab.count({ where: published }),
    prisma.lab.findMany({ where: { ...published, tags: { none: {} } }, select: { id: true, title: true } }),
    Promise.all([
      prisma.project.count({ where: { publishStatus: "DRAFT" } }),
      prisma.lab.count({ where: { publishStatus: "DRAFT" } }),
      prisma.article.count({ where: { publishStatus: "DRAFT" } }),
      prisma.certificate.count({ where: { publishStatus: "DRAFT" } }),
    ]),
  ]);

  const resumeRegistered = settings?.resumeUrl
    ? Boolean(await prisma.media.findFirst({ where: { url: settings.resumeUrl, type: "PDF" }, select: { id: true } }))
    : false;
  const [draftProjects, draftLabs, draftArticles, draftCerts] = drafts;
  const draftTotal = draftProjects + draftLabs + draftArticles + draftCerts;
  const featured = settings?.homepageProjectIds.length ?? 0;

  const checks: HealthCheck[] = [
    resumeRegistered
      ? { id: "resume", level: "ok", title: "Résumé PDF is set", detail: "The Résumé page and download button use it.", href: "/admin/settings#resume", action: "Change" }
      : { id: "resume", level: "fix", title: "Résumé PDF isn't set", detail: "Upload your résumé to Media, then select it in Settings. Recruiters look for this first.", href: "/admin/settings#resume", action: "Set résumé" },
    about.profileImageUrl
      ? { id: "photo", level: "ok", title: "Profile photo is set", detail: "Shown in the homepage hero and on About.", href: "/admin/about", action: "Change" }
      : { id: "photo", level: "fix", title: "No profile photo", detail: "A friendly photo makes you memorable. It shows in the hero and on About.", href: "/admin/about", action: "Add photo" },
    certsMissingLink.length
      ? {
          id: "cert-links", level: "fix",
          title: `${certsMissingLink.length} certificate${certsMissingLink.length === 1 ? " has" : "s have"} no verify link`,
          detail: "Add the Credly, Coursera or issuer URL so employers can check it in one click.",
          href: "/admin/certificates", action: "Open certificates",
          items: list(certsMissingLink, (c) => ({ label: c.name, href: `/admin/certificates/${c.id}` })),
        }
      : { id: "cert-links", level: "ok", title: "Every certificate has a verify link", detail: "Employers can check each one.", href: "/admin/certificates", action: "View" },
    projectsMissingImage.length
      ? {
          id: "project-images", level: "fix",
          title: `${projectsMissingImage.length} project${projectsMissingImage.length === 1 ? " has" : "s have"} no screenshot`,
          detail: "Without a thumbnail the card shows a live preview or a blank frame. Upload a screenshot in Media and pick it as the thumbnail.",
          href: "/admin/projects", action: "Open projects",
          items: list(projectsMissingImage, (p) => ({ label: p.title, href: `/admin/projects/${p.id}` })),
        }
      : { id: "project-images", level: "ok", title: "Every project has a screenshot", detail: "Project cards look complete.", href: "/admin/projects", action: "View" },
    labsMissingTags.length
      ? {
          id: "lab-tags", level: "fix",
          title: `${labsMissingTags.length} lab${labsMissingTags.length === 1 ? " has" : "s have"} no tags`,
          detail: "Tags power the homepage Skills picker. Add the tools and topics each lab covers.",
          href: "/admin/labs", action: "Open labs",
          items: list(labsMissingTags, (l) => ({ label: l.title, href: `/admin/labs/${l.id}` })),
        }
      : null,
    featured < 2
      ? { id: "featured", level: "tip", title: `${featured}/2 homepage projects chosen`, detail: "Star up to two projects to feature them on the homepage.", href: "/admin/projects", action: "Choose projects" }
      : null,
    labs < 3
      ? { id: "labs-count", level: "tip", title: `${labs} published lab${labs === 1 ? "" : "s"}`, detail: "Labs are your strongest IT proof. Three or more, ideally on real hardware or VMs, makes a real difference.", href: "/admin/labs/new", action: "Start a lab" }
      : { id: "labs-count", level: "ok", title: `${labs} published labs`, detail: "Good depth of hands-on proof.", href: "/admin/labs", action: "View" },
    draftTotal
      ? {
          id: "drafts", level: "tip",
          title: `${draftTotal} unpublished draft${draftTotal === 1 ? "" : "s"}`,
          detail: [draftProjects && `${draftProjects} project${draftProjects === 1 ? "" : "s"}`, draftLabs && `${draftLabs} lab${draftLabs === 1 ? "" : "s"}`, draftArticles && `${draftArticles} journal entr${draftArticles === 1 ? "y" : "ies"}`, draftCerts && `${draftCerts} certificate${draftCerts === 1 ? "" : "s"}`].filter(Boolean).join(", ") + ". Finish and publish them, or archive what you won't use.",
          href: draftLabs ? "/admin/labs" : draftProjects ? "/admin/projects" : draftArticles ? "/admin/journal" : "/admin/certificates",
          action: "Review drafts",
        }
      : null,
    settings?.homepage
      ? null
      : { id: "homepage", level: "tip", title: "Homepage is using the starter text", detail: "Read it through and make it sound like you. Every line is editable.", href: "/admin/homepage", action: "Edit homepage" },
  ].filter((check): check is HealthCheck => check !== null);

  const rank: Record<HealthLevel, number> = { fix: 0, tip: 1, ok: 2 };
  return checks.sort((a, b) => rank[a.level] - rank[b.level]);
}
