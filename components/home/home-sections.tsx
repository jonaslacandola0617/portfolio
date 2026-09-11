import Link from "next/link";
import { ArrowUpRight, Github, Linkedin } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";
import { ProjectVisualPreview } from "@/components/shared/project-visual-preview";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import { formatDate } from "@/lib/utils";
import type { ArticleFrontmatter, DbContentItem, LabFrontmatter, ProjectFrontmatter } from "@/types";

type ProjectItem = DbContentItem<ProjectFrontmatter>;
type LabItem = DbContentItem<LabFrontmatter>;
type ArticleItem = DbContentItem<ArticleFrontmatter>;

export function HomeSections({
  primaryProject,
  secondaryProject,
  featuredLab,
  articles,
  settings,
  currentYear,
}: {
  primaryProject?: ProjectItem;
  secondaryProject?: ProjectItem;
  featuredLab?: LabItem;
  articles: ArticleItem[];
  settings: SiteSettingsData;
  currentYear: number;
}) {
  const focusItems = settings.currentlyLearning.slice(0, 3);

  return (
    <>
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
          <Link href={`/projects/${primaryProject.frontmatter.slug}`} className="space-project-visual" aria-label={`Open ${primaryProject.frontmatter.title}`}>
            <ProjectVisualPreview
              title={primaryProject.frontmatter.title}
              liveSiteUrl={primaryProject.frontmatter.liveSiteUrl}
              thumbnail={primaryProject.frontmatter.thumbnail}
            />
          </Link>
          <div className="bauhaus-axis axis-rust" aria-hidden="true"><span /></div>
        </section>
      ) : null}

      {secondaryProject ? (
        <section className="space-project space-project-light space-project-reverse">
          <div className="space-index">02</div>
          <Link href={`/projects/${secondaryProject.frontmatter.slug}`} className="space-project-visual" aria-label={`Open ${secondaryProject.frontmatter.title}`}>
            <ProjectVisualPreview
              title={secondaryProject.frontmatter.title}
              liveSiteUrl={secondaryProject.frontmatter.liveSiteUrl}
              thumbnail={secondaryProject.frontmatter.thumbnail}
            />
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
    </>
  );
}
