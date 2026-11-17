import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, Briefcase, Cpu, ExternalLink, Github, LifeBuoy, Network, ShieldCheck, Sparkles, Wrench,
} from "lucide-react";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import { Reveal, TiltFrame } from "@/components/site/interactive";
import { LabTopology } from "@/components/site/lab-topology";
import { StackExplorer, type EvidenceItem } from "@/components/site/stack-explorer";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { AI_ASSISTED_CATEGORY, aiAssistedNote, experience, outsideIT } from "@/lib/profile";
import { formatDateShort } from "@/lib/utils";
import type { ArticleFrontmatter, Certification, DbContentItem, LabFrontmatter, ProjectFrontmatter } from "@/types";

type ProjectItem = DbContentItem<ProjectFrontmatter>;
type LabItem = DbContentItem<LabFrontmatter>;
type ArticleItem = DbContentItem<ArticleFrontmatter>;

const IT_SKILLS = ["Troubleshooting", "Hardware", "Client support", "Networking", "VLANs", "Routing", "Subnetting", "Linux", "Cybersecurity", "Data privacy", "Documentation"];

function SectionHead({ index, title, kicker, children }: { index: string; title: React.ReactNode; kicker: string; children?: React.ReactNode }) {
  return (
    <Reveal className="section-head">
      <p className="eyebrow"><span className="eyebrow-index">{index}</span>{kicker}</p>
      <h2>{title}</h2>
      {children ? <div className="section-head-aside">{children}</div> : null}
    </Reveal>
  );
}

function yearOf(date?: string) {
  if (!date) return undefined;
  const year = new Date(date).getFullYear();
  return Number.isFinite(year) ? year : undefined;
}

function LabCard({ lab, index }: { lab: LabItem; index: number }) {
  const { frontmatter: fm } = lab;
  const status = { completed: "Completed", "in-progress": "In progress", planned: "Planned" }[fm.status] ?? fm.status;
  return (
    <Reveal as="article" className="lab-card" delay={index * 70}>
      <Link href={`/labs/${fm.slug}`} className="lab-card-link">
        <div className="lab-card-visual">
          <LabTopology seed={fm.slug} className="lab-topology" />
          <span className="lab-card-index">LAB {String(index + 1).padStart(2, "0")}</span>
        </div>
        <div className="lab-card-body">
          <p className="work-meta">
            <span>{fm.category}</span>
            <span className={fm.status === "completed" ? "work-live" : undefined}>{fm.status === "completed" ? <i className="live-dot" /> : null}{status}</span>
            <span>{formatDateShort(fm.date)}</span>
          </p>
          <h3>{fm.title}</h3>
          <p>{fm.purpose}</p>
          {fm.tags.length ? <ul className="chip-list">{fm.tags.slice(0, 4).map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
          <span className="text-link">Read lab notes <ArrowRight size={14} /></span>
        </div>
      </Link>
    </Reveal>
  );
}

function FeaturedProject({ project, index }: { project: ProjectItem; index: number }) {
  const { frontmatter: fm } = project;
  const href = `/projects/${fm.slug}`;
  const aiAssisted = AI_ASSISTED_CATEGORY.test(fm.category);

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
        {aiAssisted ? <p className="ai-badge"><Sparkles size={13} aria-hidden="true" /> {aiAssistedNote.short}</p> : null}
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
  featuredProjects,
  projects,
  labs,
  certificates,
  articles,
}: {
  featuredProjects: ProjectItem[];
  projects: ProjectItem[];
  labs: LabItem[];
  certificates: Certification[];
  articles: ArticleItem[];
  settings: SiteSettingsData;
}) {
  const evidence: EvidenceItem[] = [
    ...experience.map((entry) => ({
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

  const capabilities = [
    {
      icon: LifeBuoy,
      title: "Support people",
      body: "I've worked a real queue: high volume, hard deadlines, confidential data, and people waiting on an answer. I stay calm and I write things down.",
      evidence: "Experience",
      href: "#experience",
    },
    {
      icon: Wrench,
      title: "Fix hardware",
      body: "PCs that won't boot, printers that won't print, builds from spare parts. I like finding the actual cause instead of guessing.",
      evidence: "Hands-on work",
      href: "#experience",
    },
    {
      icon: Network,
      title: "Understand networks",
      body: "Subnetting and VLSM, VLANs and trunking, inter-VLAN and static routing on Cisco IOS. I set it up, test it, and document it.",
      evidence: labs.length ? `${labs.length} documented labs` : "Labs",
      href: "/labs",
    },
    {
      icon: ShieldCheck,
      title: "Think about security",
      body: "Google's cybersecurity training: NIST CSF, security controls, logs and SIEM basics, incident response, Linux and SQL.",
      evidence: certificates.length ? "Certificates" : "About",
      href: certificates.length ? "/certifications" : "/about",
    },
  ];

  return (
    <>
      <section id="experience" className="section section-experience" aria-labelledby="exp-title">
        <SectionHead index="01" kicker="Experience" title={<span id="exp-title">Seven months in a support queue, and a lot of fixing things at home.</span>}>
          <p>My first job wasn&apos;t in IT, but the work was close to help desk: tickets, deadlines, accuracy, privacy, and people waiting on you.</p>
        </SectionHead>
        <ol className="exp-list">
          {experience.map((entry, index) => (
            <Reveal as="li" key={entry.title} className="exp-item" delay={index * 80}>
              <div className="exp-side">
                <span className="exp-icon" aria-hidden="true">{index === 0 ? <Briefcase size={18} /> : <Cpu size={18} />}</span>
                <span className="exp-period">{entry.period}</span>
              </div>
              <div className="exp-body">
                <h3>{entry.title}</h3>
                <p className="exp-org">{entry.org}{entry.place ? ` · ${entry.place}` : ""}</p>
                <p className="exp-summary">{entry.summary}</p>
                <ul className="exp-points">
                  {entry.points.map((point) => <li key={point}>{point}</li>)}
                </ul>
                <ul className="chip-list" aria-label="Skills used">
                  {entry.skills.map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {labs.length ? (
        <section id="labs" className="section section-labs" aria-labelledby="labs-title">
          <SectionHead index="02" kicker="Networking labs" title={<span id="labs-title">Networks I&apos;ve built, broken and fixed.</span>}>
            <p>Each lab has the goal, the topology, the commands I used, what went wrong, and how I checked the fix.</p>
            <Link href="/labs" className="text-link">All {labs.length} labs <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="lab-grid">
            {labs.slice(0, 4).map((lab, index) => <LabCard key={lab.recordId} lab={lab} index={index} />)}
          </div>
        </section>
      ) : null}

      {certificates.length ? (
        <section className="section section-certs" aria-labelledby="certs-title">
          <SectionHead index="03" kicker="Certificates" title={<span id="certs-title">Training I&apos;ve completed.</span>}>
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

      <section className="section section-stack" aria-labelledby="stack-title">
        <SectionHead index="04" kicker="Skills" title={<span id="stack-title">Pick a skill, see where I used it.</span>}>
          <p>Every skill links to the job, lab, certificate or project where I actually used it.</p>
        </SectionHead>
        <Reveal><StackExplorer items={evidence} preferred={IT_SKILLS} /></Reveal>
      </section>

      <section className="section section-capabilities" aria-labelledby="cap-title">
        <SectionHead index="05" kicker="What I bring" title={<span id="cap-title">What I can do for an IT team.</span>} />
        <div className="cap-grid">
          {capabilities.map((capability, index) => (
            <Reveal key={capability.title} as="article" className="cap-card" delay={index * 70}>
              <capability.icon size={22} strokeWidth={1.6} aria-hidden="true" />
              <h3>{capability.title}</h3>
              <p>{capability.body}</p>
              <Link href={capability.href} className="text-link">{capability.evidence} <ArrowRight size={14} /></Link>
            </Reveal>
          ))}
        </div>
      </section>

      {featuredProjects.length ? (
        <section id="projects" className="section section-work" aria-labelledby="work-title">
          <SectionHead index="06" kicker="Projects" title={<span id="work-title">Things I&apos;ve set up and shipped.</span>}>
            <p>{aiAssistedNote.long}</p>
            <Link href="/projects" className="text-link">All {projects.length} projects <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="work-list">
            {featuredProjects.map((project, index) => <FeaturedProject key={project.recordId} project={project} index={index} />)}
          </div>
        </section>
      ) : null}

      <section className="section section-outside" aria-labelledby="outside-title">
        <SectionHead index="07" kicker="Outside IT" title={<span id="outside-title">{outsideIT.title}</span>}>
          <p>{outsideIT.intro}</p>
          <Link href="/video" className="text-link">See video work <ArrowUpRight size={15} /></Link>
        </SectionHead>
        <div className="outside-grid">
          {outsideIT.areas.map((area, index) => (
            <Reveal key={area.name} as="article" className="outside-card" delay={index * 70}>
              <h3>{area.name}</h3>
              <p>{area.body}</p>
              <ul className="chip-list">{area.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
            </Reveal>
          ))}
        </div>
      </section>

      {articles.length ? (
        <section className="section section-now" aria-labelledby="now-title">
          <SectionHead index="08" kicker="Writing" title={<span id="now-title">Notes from what I&apos;m learning.</span>}>
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
