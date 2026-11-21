import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Briefcase, Code2, Cpu, ExternalLink, Github, LifeBuoy, Network, Palette, ShieldCheck, Sparkles, Wrench,
} from "lucide-react";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import { Reveal, TiltFrame } from "@/components/site/interactive";
import { LabCard } from "@/components/shared/lab-card";
import { StackExplorer, type EvidenceItem } from "@/components/site/stack-explorer";
import { formatDateShort } from "@/lib/utils";
import type { HomepageContent, HomepageSectionKey } from "@/lib/validations/homepage";
import type { ArticleFrontmatter, Certification, DbContentItem, LabFrontmatter, ProjectFrontmatter } from "@/types";

type ProjectItem = DbContentItem<ProjectFrontmatter>;
type LabItem = DbContentItem<LabFrontmatter>;
type ArticleItem = DbContentItem<ArticleFrontmatter>;

const IT_SKILLS = ["Troubleshooting", "Hardware", "Client support", "Networking", "VLANs", "Routing", "Subnetting", "Linux", "Cybersecurity", "Data privacy", "Documentation"];

const CAPABILITY_ICON = {
  support: LifeBuoy,
  hardware: Wrench,
  network: Network,
  security: ShieldCheck,
  code: Code2,
  design: Palette,
} as const;

function SectionHead({ index, section, children }: { index: number; section: HomepageContent["sections"][HomepageSectionKey]; children?: React.ReactNode }) {
  const hasAside = Boolean(section.intro) || Boolean(children);
  return (
    <Reveal className="section-head">
      <p className="eyebrow"><span className="eyebrow-index">{String(index).padStart(2, "0")}</span>{section.kicker}</p>
      <h2>{section.title}</h2>
      {hasAside ? (
        <div className="section-head-aside">
          {section.intro ? <p>{section.intro}</p> : null}
          {children}
        </div>
      ) : null}
    </Reveal>
  );
}

function yearOf(date?: string) {
  if (!date) return undefined;
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? year : undefined;
}

function FeaturedProject({ project, index, aiBadge }: { project: ProjectItem; index: number; aiBadge: string }) {
  const { frontmatter: fm } = project;
  const href = `/projects/${fm.slug}`;

  return (
    <Reveal as="article" className="work-item" delay={60}>
      <Link href={href} className="work-media" aria-label={`Read about ${fm.title}`} tabIndex={-1}>
        <TiltFrame>
          <ProjectVisualPreview title={fm.title} liveSiteUrl={fm.liveSiteUrl} thumbnail={fm.thumbnail} />
        </TiltFrame>
        <span className="work-cursor" aria-hidden="true">View project <ArrowUpRight size={14} /></span>
      </Link>

      <div className="work-copy">
        <p className="work-meta">
          <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
          <span>{fm.category}</span>
          <span>{yearOf(fm.completionDate)}</span>
          {fm.liveSiteUrl ? <span className="work-live"><i className="live-dot" /> Live</span> : null}
        </p>
        <h3><Link href={href}>{fm.title}</Link></h3>
        <p className="work-summary">{fm.summary}</p>
        {fm.aiAssisted ? <p className="ai-badge"><Sparkles size={13} aria-hidden="true" /> {aiBadge}</p> : null}
        {fm.technologies.length ? (
          <ul className="chip-list" aria-label="Built with">
            {fm.technologies.slice(0, 5).map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        ) : null}
        <div className="work-actions">
          <Link href={href} className="btn btn-solid btn-sm">Details <ArrowRight size={14} /></Link>
          {fm.liveSiteUrl ? <a href={fm.liveSiteUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Live <ArrowUpRight size={14} /></a> : null}
          {fm.githubUrl ? <a href={fm.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" aria-label={`${fm.title} source code`}><Github size={14} /> Code</a> : null}
        </div>
      </div>
    </Reveal>
  );
}

export function HomeSections({
  content,
  featuredProjects,
  projects,
  labs,
  certificates,
  articles,
}: {
  content: HomepageContent;
  featuredProjects: ProjectItem[];
  projects: ProjectItem[];
  labs: LabItem[];
  certificates: Certification[];
  articles: ArticleItem[];
}) {
  const { sections } = content;

  const evidence: EvidenceItem[] = [
    ...content.experience.map((entry) => ({
      title: entry.title,
      href: "#experience",
      kind: "Experience" as const,
      keys: entry.skills,
    })),
    ...labs.map(({ frontmatter: fm }) => ({
      title: fm.title,
      href: `/labs/${fm.slug}`,
      kind: "Lab" as const,
      year: yearOf(fm.date),
      keys: [fm.category, ...fm.tags],
    })),
    ...certificates.map((cert) => ({
      title: cert.name,
      href: "/certifications",
      kind: "Certification" as const,
      year: yearOf(cert.dateCompleted ?? cert.dateStarted),
      keys: cert.skills,
    })),
    ...projects.map(({ frontmatter: fm }) => ({
      title: fm.title,
      href: `/projects/${fm.slug}`,
      kind: "Project" as const,
      year: yearOf(fm.completionDate),
      keys: [...fm.technologies, ...fm.tags, ...fm.skills],
      live: Boolean(fm.liveSiteUrl),
    })),
  ];

  // Only render sections that are switched on and have something to show; number them in order.
  const order: { key: HomepageSectionKey; show: boolean }[] = [
    { key: "experience", show: content.experience.length > 0 },
    { key: "labs", show: labs.length > 0 },
    { key: "certificates", show: certificates.length > 0 },
    { key: "skills", show: evidence.length > 0 },
    { key: "capabilities", show: content.capabilities.length > 0 },
    { key: "projects", show: featuredProjects.length > 0 },
    { key: "outside", show: content.outside.areas.length > 0 },
    { key: "writing", show: articles.length > 0 },
  ];
  const visible = order.filter((entry) => entry.show && sections[entry.key].visible).map((entry) => entry.key);
  const numberOf = (key: HomepageSectionKey) => visible.indexOf(key) + 1;
  const isOn = (key: HomepageSectionKey) => visible.includes(key);

  return (
    <>
      {isOn("experience") ? (
        <section id="experience" className="section section-experience" aria-label={sections.experience.kicker}>
          <SectionHead index={numberOf("experience")} section={sections.experience} />
          <ol className="exp-list">
            {content.experience.map((entry, index) => (
              <Reveal as="li" key={`${entry.title}-${index}`} className="exp-item" delay={index * 80}>
                <div className="exp-side">
                  <span className="exp-icon" aria-hidden="true">{index === 0 ? <Briefcase size={18} /> : <Cpu size={18} />}</span>
                  <span className="exp-period">{entry.period}</span>
                </div>
                <div className="exp-body">
                  <h3>{entry.title}</h3>
                  <p className="exp-org">{entry.org}{entry.place ? ` · ${entry.place}` : ""}</p>
                  {entry.summary ? <p className="exp-summary">{entry.summary}</p> : null}
                  {entry.points.length ? (
                    <ul className="exp-points">
                      {entry.points.map((point) => <li key={point}>{point}</li>)}
                    </ul>
                  ) : null}
                  {entry.skills.length ? (
                    <ul className="chip-list" aria-label="Skills used">
                      {entry.skills.map((skill) => <li key={skill}>{skill}</li>)}
                    </ul>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </ol>
        </section>
      ) : null}

      {isOn("labs") ? (
        <section id="labs" className="section section-labs" aria-label={sections.labs.kicker}>
          <SectionHead index={numberOf("labs")} section={sections.labs}>
            <Link href="/labs" className="text-link">All {labs.length} labs <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="lab-grid">
            {labs.slice(0, 4).map((lab, index) => <LabCard key={lab.recordId} lab={lab.frontmatter} index={index} />)}
          </div>
        </section>
      ) : null}

      {isOn("certificates") ? (
        <section id="certificates" className="section section-certs" aria-label={sections.certificates.kicker}>
          <SectionHead index={numberOf("certificates")} section={sections.certificates}>
            <Link href="/certifications" className="text-link">Certificate details <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <ul className="cert-list">
            {certificates.slice(0, 6).map((cert, index) => (
              <Reveal as="li" key={cert.id} className="cert-row" delay={index * 50}>
                <span className="cert-mark" aria-hidden="true">
                  {cert.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cert.logoUrl} alt="" />
                  ) : <BadgeCheck size={20} />}
                </span>
                <span className="cert-copy">
                  <small>{cert.issuer}</small>
                  <strong>{cert.name}</strong>
                </span>
                <span className={cert.dateCompleted ? "cert-status is-done" : "cert-status"}>
                  {cert.dateCompleted ? `Completed ${formatDateShort(cert.dateCompleted)}` : "In progress"}
                </span>
                {cert.credentialUrl ? (
                  <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Verify <ExternalLink size={13} /></a>
                ) : <span />}
              </Reveal>
            ))}
          </ul>
        </section>
      ) : null}

      {isOn("skills") ? (
        <section id="skills" className="section section-stack" aria-label={sections.skills.kicker}>
          <SectionHead index={numberOf("skills")} section={sections.skills} />
          <Reveal><StackExplorer items={evidence} preferred={IT_SKILLS} /></Reveal>
        </section>
      ) : null}

      {isOn("capabilities") ? (
        <section id="capabilities" className="section section-capabilities" aria-label={sections.capabilities.kicker}>
          <SectionHead index={numberOf("capabilities")} section={sections.capabilities} />
          <div className="cap-grid">
            {content.capabilities.map((capability, index) => {
              const Icon = CAPABILITY_ICON[capability.icon];
              return (
                <Reveal key={`${capability.title}-${index}`} as="article" className="cap-card" delay={index * 70}>
                  <Icon size={22} strokeWidth={1.6} aria-hidden="true" />
                  <h3>{capability.title}</h3>
                  <p>{capability.body}</p>
                  <Link href={capability.href} className="text-link">{capability.linkLabel} <ArrowRight size={14} /></Link>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {isOn("projects") ? (
        <section id="projects" className="section section-work" aria-label={sections.projects.kicker}>
          <SectionHead index={numberOf("projects")} section={{ ...sections.projects, intro: sections.projects.intro || content.aiNote.long }}>
            <Link href="/projects" className="text-link">All {projects.length} projects <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="work-list">
            {featuredProjects.map((project, index) => (
              <FeaturedProject key={project.recordId} project={project} index={index} aiBadge={content.aiNote.short} />
            ))}
          </div>
        </section>
      ) : null}

      {isOn("outside") ? (
        <section id="outside" className="section section-outside" aria-label={sections.outside.kicker}>
          <SectionHead index={numberOf("outside")} section={sections.outside}>
            {content.outside.linkLabel && content.outside.href ? (
              <Link href={content.outside.href} className="text-link">{content.outside.linkLabel} <ArrowUpRight size={15} /></Link>
            ) : null}
          </SectionHead>
          <div className="outside-grid">
            {content.outside.areas.map((area, index) => (
              <Reveal key={`${area.name}-${index}`} as="article" className="outside-card" delay={index * 70}>
                <h3>{area.name}</h3>
                <p>{area.body}</p>
                {area.tools.length ? <ul className="chip-list">{area.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul> : null}
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      {isOn("writing") ? (
        <section id="writing" className="section section-now" aria-label={sections.writing.kicker}>
          <SectionHead index={numberOf("writing")} section={sections.writing}>
            <Link href="/journal" className="text-link">All writing <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <Reveal className="now-writing">
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
          </Reveal>
        </section>
      ) : null}
    </>
  );
}
