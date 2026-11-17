import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, Code2, ExternalLink, Github, LifeBuoy, Network, ShieldCheck } from "lucide-react";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import { Reveal, TiltFrame } from "@/components/site/interactive";
import { LabTopology } from "@/components/site/lab-topology";
import { StackExplorer, type EvidenceItem } from "@/components/site/stack-explorer";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { formatDateShort } from "@/lib/utils";
import type { ArticleFrontmatter, Certification, DbContentItem, LabFrontmatter, ProjectFrontmatter } from "@/types";

type ProjectItem = DbContentItem<ProjectFrontmatter>;
type LabItem = DbContentItem<LabFrontmatter>;
type ArticleItem = DbContentItem<ArticleFrontmatter>;

const IT_SKILLS = ["Networking", "Cisco Packet Tracer", "VLANs", "Routing", "Subnetting", "ACLs", "DHCP", "Linux", "Cybersecurity", "Windows", "Active Directory", "Troubleshooting"];

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

  return (
    <Reveal as="article" className="work-item" delay={60}>
      <Link href={href} className="work-media" aria-label={`Read the ${fm.title} case study`} tabIndex={-1}>
        <TiltFrame>
          <ProjectVisualPreview title={fm.title} liveSiteUrl={fm.liveSiteUrl} thumbnail={fm.thumbnail} />
        </TiltFrame>
        <span className="work-cursor" aria-hidden="true">View case study <ArrowUpRight size={14} /></span>
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
        {fm.technologies.length ? (
          <ul className="chip-list" aria-label="Built with">
            {fm.technologies.slice(0, 5).map((technology) => <li key={technology}>{technology}</li>)}
          </ul>
        ) : null}
        <div className="work-actions">
          <Link href={href} className="btn btn-solid btn-sm">Case study <ArrowRight size={14} /></Link>
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
  settings,
}: {
  featuredProjects: ProjectItem[];
  projects: ProjectItem[];
  labs: LabItem[];
  certificates: Certification[];
  articles: ArticleItem[];
  settings: SiteSettingsData;
}) {
  const evidence: EvidenceItem[] = [
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
      title: "Support",
      body: "Troubleshooting methodically, from user report to root cause. Client support, documentation, and careful handling of sensitive data — explained in plain language.",
      evidence: "Background & experience",
      href: "/about",
    },
    {
      icon: Network,
      title: "Networks",
      body: "Designing and configuring small networks: subnetting, VLANs and trunking, static and dynamic routing, DHCP and ACLs — then verifying and documenting them.",
      evidence: labs.length ? `${labs.length} documented labs` : "Labs",
      href: "/labs",
    },
    {
      icon: ShieldCheck,
      title: "Security",
      body: "Security fundamentals from structured training and Linux practice: least privilege, segmentation, hardening, and reading what the logs are telling you.",
      evidence: certificates.length ? `${certificates.length} credentials & tracks` : "Certifications",
      href: "/certifications",
    },
    {
      icon: Code2,
      title: "Automation & tools",
      body: "When a workflow needs a tool, I can build it — I've shipped web apps end to end, so I understand the systems I support from the inside.",
      evidence: projects.length ? `${projects.length} projects` : "Projects",
      href: "/projects",
    },
  ];

  const learning = settings.currentlyLearning.slice(0, 4);

  return (
    <>
      {labs.length ? (
        <section id="labs" className="section section-labs" aria-labelledby="labs-title">
          <SectionHead index="01" kicker="Hands-on labs" title={<span id="labs-title">Configured, broken, fixed — and written down.</span>}>
            <p>Each lab records the objective, the topology, the commands, what went wrong, and how I verified the fix.</p>
            <Link href="/labs" className="text-link">All {labs.length} labs <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="lab-grid">
            {labs.slice(0, 4).map((lab, index) => <LabCard key={lab.recordId} lab={lab} index={index} />)}
          </div>
        </section>
      ) : null}

      {certificates.length ? (
        <section className="section section-certs" aria-labelledby="certs-title">
          <SectionHead index="02" kicker="Credentials" title={<span id="certs-title">Structured training, verified.</span>}>
            <Link href="/certifications" className="text-link">Certification details <ArrowUpRight size={15} /></Link>
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

      {evidence.length ? (
        <section className="section section-stack" aria-labelledby="stack-title">
          <SectionHead index="03" kicker="Skills" title={<span id="stack-title">Skills, with receipts.</span>}>
            <p>Pick a skill to see the labs, credentials and projects that back it up.</p>
          </SectionHead>
          <Reveal><StackExplorer items={evidence} preferred={IT_SKILLS} /></Reveal>
        </section>
      ) : null}

      <section className="section section-capabilities" aria-labelledby="cap-title">
        <SectionHead index="04" kicker="What I bring" title={<span id="cap-title">IT support that understands the whole stack.</span>} />
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
          <SectionHead index="05" kicker="Projects" title={<span id="work-title">I also build the tools.</span>}>
            <p>Building and deploying real applications taught me how the systems I support fit together — servers, DNS, databases, auth and all.</p>
            <Link href="/projects" className="text-link">All {projects.length} projects <ArrowUpRight size={15} /></Link>
          </SectionHead>
          <div className="work-list">
            {featuredProjects.map((project, index) => <FeaturedProject key={project.recordId} project={project} index={index} />)}
          </div>
        </section>
      ) : null}

      <section className="section section-now" aria-labelledby="now-title">
        <SectionHead index="06" kicker="Lately" title={<span id="now-title">Always studying the next layer down.</span>} />
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
              <Link href="/certifications" className="text-link">Credentials &amp; progress <ArrowUpRight size={14} /></Link>
              <Link href="/resume" className="text-link">Résumé <ArrowUpRight size={14} /></Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
