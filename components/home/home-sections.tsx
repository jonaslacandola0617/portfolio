import Link from "next/link";
import { ArrowRight, ArrowUpRight, Code2, Github, LifeBuoy, ShieldCheck } from "lucide-react";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import { Reveal, TiltFrame } from "@/components/site/interactive";
import { StackExplorer, type StackProject } from "@/components/site/stack-explorer";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { formatDateShort } from "@/lib/utils";
import type { ArticleFrontmatter, DbContentItem, LabFrontmatter, ProjectFrontmatter } from "@/types";

type ProjectItem = DbContentItem<ProjectFrontmatter>;
type LabItem = DbContentItem<LabFrontmatter>;
type ArticleItem = DbContentItem<ArticleFrontmatter>;

function SectionHead({ index, title, kicker, children }: { index: string; title: React.ReactNode; kicker: string; children?: React.ReactNode }) {
  return (
    <Reveal className="section-head">
      <p className="eyebrow"><span className="eyebrow-index">{index}</span>{kicker}</p>
      <h2>{title}</h2>
      {children ? <div className="section-head-aside">{children}</div> : null}
    </Reveal>
  );
}

function FeaturedProject({ project, index }: { project: ProjectItem; index: number }) {
  const { frontmatter: fm } = project;
  const year = new Date(fm.completionDate).getFullYear();
  const href = `/projects/${fm.slug}`;

  return (
    <Reveal as="article" className="work-item" delay={60}>
      <Link href={href} className="work-media" aria-label={`Read the ${fm.title} case study`} tabIndex={-1}>
        <TiltFrame>
          <ProjectVisualPreview title={fm.title} liveSiteUrl={fm.liveSiteUrl} thumbnail={fm.thumbnail} priority={index === 0} />
        </TiltFrame>
        <span className="work-cursor" aria-hidden="true">View case study <ArrowUpRight size={14} /></span>
      </Link>

      <div className="work-copy">
        <p className="work-meta">
          <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
          <span>{fm.category}</span>
          <span>{year}</span>
          {fm.liveSiteUrl ? <span className="work-live"><i className="live-dot" /> Live</span> : null}
        </p>
        <h3><Link href={href}>{fm.title}</Link></h3>
        <p className="work-summary">{fm.summary}</p>
        {fm.technologies.length ? (
          <ul className="chip-list" aria-label="Built with">
            {fm.technologies.slice(0, 5).map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        ) : null}
        <div className="work-actions">
          <Link href={href} className="btn btn-solid btn-sm">Case study <ArrowRight size={14} /></Link>
          {fm.liveSiteUrl ? <a href={fm.liveSiteUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Live site <ArrowUpRight size={14} /></a> : null}
          {fm.githubUrl ? <a href={fm.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label={`${fm.title} source code`}><Github size={14} /> Code</a> : null}
        </div>
      </div>
    </Reveal>
  );
}

export function HomeSections({
  featured,
  projects,
  labs,
  articles,
  settings,
  certificationCount,
}: {
  featured: ProjectItem[];
  projects: ProjectItem[];
  labs: LabItem[];
  articles: ArticleItem[];
  settings: SiteSettingsData;
  certificationCount: number;
}) {
  const webCount = projects.filter((project) => /web|software|app/i.test(project.frontmatter.category)).length;
  const stackProjects: StackProject[] = projects.map(({ frontmatter: fm }) => ({
    title: fm.title,
    slug: fm.slug,
    category: fm.category,
    year: new Date(fm.completionDate).getFullYear(),
    technologies: fm.technologies,
    live: Boolean(fm.liveSiteUrl),
  }));

  const capabilities = [
    {
      icon: Code2,
      title: "Build",
      body: "Full-stack web applications — data model, API, interface and deployment — with Laravel and PHP, React, Next.js, TypeScript and SQL.",
      evidence: webCount ? `${webCount} web projects` : "Selected work",
      href: "/projects",
    },
    {
      icon: LifeBuoy,
      title: "Support",
      body: "Hands-on IT and client support: troubleshooting methodically, documenting fixes, handling sensitive data, and explaining things in plain language.",
      evidence: "Background & experience",
      href: "/about",
    },
    {
      icon: ShieldCheck,
      title: "Secure",
      body: "Networking and security foundations from Cisco labs, Linux practice and cybersecurity training — so what I build is reachable, segmented and safe.",
      evidence: labs.length ? `${labs.length} documented labs` : "Certifications",
      href: labs.length ? "/labs" : "/certifications",
    },
  ];

  const learning = settings.currentlyLearning.slice(0, 4);

  return (
    <>
      {featured.length ? (
        <section id="work" className="section section-work" aria-labelledby="work-title">
          <SectionHead index="01" kicker="Selected work" title={<span id="work-title">Shipped, in production, and documented.</span>}>
            <p>Each project links to a case study covering the problem, the decisions, and what I&apos;d do differently.</p>
            <Link href="/projects" className="text-link">All {projects.length} projects <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="work-list">
            {featured.map((project, index) => <FeaturedProject key={project.recordId} project={project} index={index} />)}
          </div>
        </section>
      ) : null}

      {stackProjects.length ? (
        <section className="section section-stack" aria-labelledby="stack-title">
          <SectionHead index="02" kicker="Stack" title={<span id="stack-title">Skills, with receipts.</span>}>
            <p>Pick a technology to see exactly where I&apos;ve used it.</p>
          </SectionHead>
          <Reveal><StackExplorer projects={stackProjects} /></Reveal>
        </section>
      ) : null}

      <section className="section section-capabilities" aria-labelledby="cap-title">
        <SectionHead index="03" kicker="What I bring" title={<span id="cap-title">A developer who also understands the network underneath.</span>} />
        <div className="cap-grid">
          {capabilities.map((capability, index) => (
            <Reveal key={capability.title} as="article" className="cap-card" delay={index * 80}>
              <capability.icon size={22} strokeWidth={1.6} aria-hidden="true" />
              <h3>{capability.title}</h3>
              <p>{capability.body}</p>
              <Link href={capability.href} className="text-link">{capability.evidence} <ArrowRight size={14} /></Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section section-now" aria-labelledby="now-title">
        <SectionHead index="04" kicker="Lately" title={<span id="now-title">Still learning in public.</span>} />
        <div className="now-grid">
          <Reveal className="now-writing">
            <p className="footer-label">Recent writing</p>
            {articles.length ? (
              <ul>
                {articles.slice(0, 4).map((article) => (
                  <li key={article.frontmatter.slug}>
                    <Link href={`/journal/${article.frontmatter.slug}`}>
                      <time dateTime={article.frontmatter.date}>{formatDateShort(article.frontmatter.date)}</time>
                      <span>{article.frontmatter.title}</span>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="muted">New notes coming soon.</p>}
            <Link href="/journal" className="text-link">All writing <ArrowUpRight size={15} /></Link>
          </Reveal>

          <Reveal className="now-card" delay={80}>
            <p className="footer-label">Currently</p>
            {learning.length ? (
              <ul>
                {learning.map((item) => (
                  <li key={`${item.label}:${item.href}`}><Link href={item.href}>{item.label}</Link></li>
                ))}
              </ul>
            ) : null}
            <div className="now-card-foot">
              {labs[0] ? (
                <Link href={`/labs/${labs[0].frontmatter.slug}`} className="text-link">Latest lab: {labs[0].frontmatter.title} <ArrowUpRight size={14} /></Link>
              ) : null}
              {certificationCount ? (
                <Link href="/certifications" className="text-link">{certificationCount} certifications &amp; tracks <ArrowUpRight size={14} /></Link>
              ) : null}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
