import Link from "next/link";
import { ArrowDown, ArrowUpRight, Github, Linkedin } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";
import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getAboutPage } from "@/lib/db/queries/about";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildWebsiteJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

export async function generateMetadata() {
  const settings = await getSiteSettings();
  return buildStaticPageMetadata({
    title: `${settings.name} — ${settings.role}`,
    description: siteConfig.description,
    path: "/",
    keywords: [
      settings.name,
      "web developer portfolio",
      "Laravel developer",
      "PHP developer",
      "React developer",
      "Next.js developer",
      "TypeScript developer",
      "full stack web development",
      "IT support portfolio",
      "technical support",
      "networking portfolio",
      "cybersecurity portfolio",
    ],
  });
}

function visualStyle(url?: string | null) {
  return url ? { backgroundImage: `url(${url})` } : undefined;
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? name,
    rest: parts.slice(1).join(" "),
  };
}

function firstSentence(value: string) {
  const sentence = value.trim().match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return sentence || value.trim();
}

export default async function HomePage() {
  const [projects, articles, labs, settings, about] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getAllLabs(),
    getSiteSettings(),
    getAboutPage(),
  ]);

  const visualProjects = projects.filter((project) => Boolean(project.frontmatter.thumbnail));
  const orderedProjects = [
    ...visualProjects,
    ...projects.filter((project) => !visualProjects.some((visual) => visual.recordId === project.recordId)),
  ];
  const primaryProject = orderedProjects[0];
  const secondaryProject = orderedProjects[1];
  const featuredLab = labs[0];
  const websiteJsonLd = buildWebsiteJsonLd({ name: settings.name, description: siteConfig.description });
  const name = splitName(settings.name);
  const focusItems = settings.currentlyLearning.slice(0, 3);
  const disciplines = settings.role.split(/\s*[·|]\s*/).map((item) => item.trim()).filter(Boolean).slice(0, 3);
  const currentYear = new Date().getFullYear();

  return (
    <div className="public-home">
      <JsonLd data={websiteJsonLd} />

      <section className="spatial-hero">
        <div className="spatial-coordinate">PH / {currentYear}</div>
        <div className="spatial-orbit" aria-hidden="true"><span /><i /><b /></div>

        <div className="spatial-name-wrap">
          <div className="spatial-line" aria-hidden="true"><span /></div>
          <h1 className="spatial-name">
            <span>{name.first}</span>
            {name.rest ? <span>{name.rest}</span> : null}
          </h1>
        </div>

        <div className="spatial-role">{settings.role.toUpperCase()}</div>
        <div className="spatial-statement">
          <p>{settings.tagline}</p>
          <p className="serif">{firstSentence(about.learningPhilosophy)}</p>
        </div>

        {focusItems.length ? (
          <div className="spatial-focus">
            <small>NOW / 01</small>
            {focusItems.map((item) => <span key={`${item.label}:${item.href}`}>{item.label}</span>)}
          </div>
        ) : null}

        {disciplines.length ? (
          <div className="spatial-disciplines">
            {disciplines.map((discipline) => <span key={discipline}>{discipline.toUpperCase()}</span>)}
          </div>
        ) : null}
        <a href="#selected-work" className="spatial-scroll" aria-label="Scroll to selected work"><ArrowDown size={17} /></a>
      </section>

      {primaryProject ? (
        <section id="selected-work" className="space-project space-project-dark">
          <div className="space-index">01</div>
          <div className="space-project-copy">
            <p className="space-eyebrow">SELECTED WORK / {primaryProject.frontmatter.category.toUpperCase()}</p>
            <h2>{primaryProject.frontmatter.title}</h2>
            <p className="space-project-summary">{primaryProject.frontmatter.summary}</p>
            <div className="space-meta">
              <span>BUILD</span><b>{primaryProject.frontmatter.technologies.slice(0, 3).join(" / ") || primaryProject.frontmatter.category}</b>
              <span>STATUS</span><b>{primaryProject.frontmatter.status}</b>
            </div>
            <Link href={`/projects/${primaryProject.frontmatter.slug}`} className="space-link">Explore project <ArrowUpRight size={15} /></Link>
          </div>
          <Link href={`/projects/${primaryProject.frontmatter.slug}`} className="space-project-visual" style={visualStyle(primaryProject.frontmatter.thumbnail)} aria-label={`Open ${primaryProject.frontmatter.title}`}>
            {!primaryProject.frontmatter.thumbnail ? <span>{primaryProject.frontmatter.title}</span> : null}
          </Link>
          <div className="bauhaus-axis axis-rust" aria-hidden="true"><span /></div>
        </section>
      ) : null}

      {secondaryProject ? (
        <section className="space-project space-project-light space-project-reverse">
          <div className="space-index">02</div>
          <Link href={`/projects/${secondaryProject.frontmatter.slug}`} className="space-project-visual" style={visualStyle(secondaryProject.frontmatter.thumbnail)} aria-label={`Open ${secondaryProject.frontmatter.title}`}>
            {!secondaryProject.frontmatter.thumbnail ? <span>{secondaryProject.frontmatter.title}</span> : null}
          </Link>
          <div className="space-project-copy">
            <p className="space-eyebrow">{secondaryProject.frontmatter.category.toUpperCase()} / EXPERIENCE</p>
            <h2>{secondaryProject.frontmatter.title}</h2>
            <p className="space-project-summary">{secondaryProject.frontmatter.summary}</p>
            <div className="space-meta">
              <span>TOOLS</span><b>{secondaryProject.frontmatter.technologies.slice(0, 3).join(" / ") || secondaryProject.frontmatter.category}</b>
              <span>YEAR</span><b>{new Date(secondaryProject.frontmatter.completionDate).getFullYear()}</b>
            </div>
            <Link href={`/projects/${secondaryProject.frontmatter.slug}`} className="space-link">View project <ArrowUpRight size={15} /></Link>
          </div>
          <div className="bauhaus-axis axis-black" aria-hidden="true"><span /></div>
        </section>
      ) : null}

      {featuredLab ? (
        <section className="space-lab">
          <div className="space-lab-grid" aria-hidden="true">
            <span className="node n1" /><span className="node n2" /><span className="node n3" /><span className="node n4" />
            <i className="edge e1" /><i className="edge e2" /><i className="edge e3" />
          </div>
          <div className="space-lab-copy">
            <p className="space-eyebrow">LAB / 03</p>
            <h2>{featuredLab.frontmatter.title}</h2>
            <p>{featuredLab.frontmatter.purpose}</p>
            <div className="space-lab-tags">{featuredLab.frontmatter.tags.slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}</div>
            <Link href={`/labs/${featuredLab.frontmatter.slug}`} className="space-link">Enter lab <ArrowUpRight size={15} /></Link>
          </div>
          <div className="space-lab-number">03</div>
        </section>
      ) : null}

      <section className="space-journal">
        <div className="space-journal-head">
          <span>04 / JOURNAL</span>
          <p>Notes from learning, building, troubleshooting, and understanding systems more deeply.</p>
        </div>
        <div className="space-journal-list">
          {articles.slice(0, 4).map((article, index) => (
            <Link key={article.frontmatter.slug} href={`/journal/${article.frontmatter.slug}`} className="space-journal-row">
              <span className="journal-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="journal-date">{formatDate(article.frontmatter.date)}</span>
              <strong>{article.frontmatter.title}</strong>
              <span className="journal-time">{article.readingTime}</span>
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </div>
        <Link href="/journal" className="space-link journal-all">All journal entries <ArrowUpRight size={15} /></Link>
      </section>

      <section className="space-about">
        <div className="space-about-shape" aria-hidden="true"><span /><i /><b /></div>
        <div className="space-about-copy">
          <p className="space-eyebrow">05 / ABOUT</p>
          <h2><span>Build.</span><span>Break.</span><span>Rebuild.</span></h2>
          <p>{settings.tagline}</p>
          <Link href="/about" className="space-link light-link">More about me <ArrowUpRight size={15} /></Link>
        </div>
        {focusItems.length ? (
          <div className="space-about-now">
            <small>CURRENTLY</small>
            {focusItems.map((item) => <span key={`about:${item.label}:${item.href}`}>{item.label}</span>)}
          </div>
        ) : null}
      </section>

      <footer className="space-footer">
        <div className="space-footer-main">
          <div className="space-footer-intro">
            <div className="space-footer-question">What should I <em>build</em> next?</div>
            <a href={`mailto:${settings.email}`} className="space-footer-email"><span className="footer-dot" />{settings.email}</a>
          </div>
          <div className="space-footer-form">
            <div className="space-footer-form-head">
              <span>06 / SEND A MESSAGE</span>
              <p>Send a message directly from the website.</p>
            </div>
            <ContactForm />
          </div>
        </div>
        <div className="space-footer-bottom">
          <span>{settings.name.toUpperCase()} / {currentYear}</span>
          <div>
            <a href={settings.githubUrl} target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
            <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={14} /> LinkedIn</a>
            <Link href="/resume">Résumé</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
