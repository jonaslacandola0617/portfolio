import Link from "next/link";
import { ArrowDown, ArrowUpRight, Github, Linkedin } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { siteConfig } from "@/lib/site-config";
import { getAllProjects, getAllArticles, getAllLabs } from "@/lib/content";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildWebsiteJsonLd } from "@/lib/structured-data";
import { formatDate } from "@/lib/utils";

export const metadata = buildStaticPageMetadata({
  title: "Jonas Lacandola — Web Developer, IT Support & Networking",
  description: siteConfig.description,
  path: "/",
  keywords: [
    "Jonas Lacandola",
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

function visualStyle(url?: string | null) {
  return url ? { backgroundImage: `url(${url})` } : undefined;
}

export default async function HomePage() {
  const [projects, articles, labs, settings] = await Promise.all([
    getAllProjects(),
    getAllArticles(),
    getAllLabs(),
    getSiteSettings(),
  ]);

  const tindahan = projects.find((project) => project.frontmatter.slug.toLowerCase().includes("tindahan")) ?? projects[0];
  const jordflix = projects.find((project) => project.frontmatter.slug.toLowerCase().includes("jordflix")) ?? projects.find((project) => project !== tindahan) ?? projects[0];
  const featuredLab = labs[0];
  const websiteJsonLd = buildWebsiteJsonLd({ name: settings.name, description: siteConfig.description });

  return (
    <div className="public-home">
      <JsonLd data={websiteJsonLd} />

      <section className="spatial-hero">
        <div className="spatial-coordinate">PH / 2026</div>
        <div className="spatial-orbit" aria-hidden="true"><span /><i /><b /></div>

        <div className="spatial-name-wrap">
          <div className="spatial-line" aria-hidden="true"><span /></div>
          <h1 className="spatial-name"><span>Jonas</span><span>Lacandola</span></h1>
        </div>

        <div className="spatial-role">WEB DEVELOPER / TECHNICAL PROBLEM SOLVER</div>
        <div className="spatial-statement">
          <p>I build practical software.</p>
          <p className="serif">I also want to know what&apos;s happening underneath it.</p>
        </div>

        <div className="spatial-focus">
          <small>NOW / 01</small>
          <span>Ethical Hacking</span>
          <span>Network Security</span>
          <span>Offensive Security</span>
        </div>

        <div className="spatial-disciplines">
          <span>WEB DEVELOPMENT</span><span>NETWORKING</span><span>CYBERSECURITY</span>
        </div>
        <a href="#selected-work" className="spatial-scroll" aria-label="Scroll to selected work"><ArrowDown size={17} /></a>
      </section>

      {tindahan ? (
        <section id="selected-work" className="space-project space-project-dark">
          <div className="space-index">01</div>
          <div className="space-project-copy">
            <p className="space-eyebrow">SELECTED WORK / PRODUCT</p>
            <h2>{tindahan.frontmatter.title}</h2>
            <p className="space-project-summary">{tindahan.frontmatter.summary}</p>
            <div className="space-meta">
              <span>BUILD</span><b>{tindahan.frontmatter.technologies.slice(0, 3).join(" / ")}</b>
              <span>STATUS</span><b>{tindahan.frontmatter.status}</b>
            </div>
            <Link href={`/projects/${tindahan.frontmatter.slug}`} className="space-link">Explore project <ArrowUpRight size={15} /></Link>
          </div>
          <Link href={`/projects/${tindahan.frontmatter.slug}`} className="space-project-visual" style={visualStyle(tindahan.frontmatter.thumbnail)} aria-label={`Open ${tindahan.frontmatter.title}`}>
            {!tindahan.frontmatter.thumbnail ? <span>{tindahan.frontmatter.title}</span> : null}
          </Link>
          <div className="bauhaus-axis axis-rust" aria-hidden="true"><span /></div>
        </section>
      ) : null}

      {jordflix ? (
        <section className="space-project space-project-light space-project-reverse">
          <div className="space-index">02</div>
          <Link href={`/projects/${jordflix.frontmatter.slug}`} className="space-project-visual" style={visualStyle(jordflix.frontmatter.thumbnail)} aria-label={`Open ${jordflix.frontmatter.title}`}>
            {!jordflix.frontmatter.thumbnail ? <span>{jordflix.frontmatter.title}</span> : null}
          </Link>
          <div className="space-project-copy">
            <p className="space-eyebrow">WEB / EXPERIENCE</p>
            <h2>{jordflix.frontmatter.title}</h2>
            <p className="space-project-summary">{jordflix.frontmatter.summary}</p>
            <div className="space-meta">
              <span>TOOLS</span><b>{jordflix.frontmatter.technologies.slice(0, 3).join(" / ")}</b>
              <span>YEAR</span><b>{new Date(jordflix.frontmatter.completionDate).getFullYear()}</b>
            </div>
            <Link href={`/projects/${jordflix.frontmatter.slug}`} className="space-link">View project <ArrowUpRight size={15} /></Link>
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
        <div className="space-about-now">
          <small>CURRENTLY</small>
          <span>Ethical hacking</span>
          <span>Networking</span>
          <span>Offensive security</span>
        </div>
      </section>

      <footer className="space-footer">
        <div className="space-footer-question">What should I <em>build</em> next?</div>
        <a href={`mailto:${siteConfig.email}`} className="space-footer-email"><span className="footer-dot" />{siteConfig.email}</a>
        <div className="space-footer-bottom">
          <span>JONAS LACANDOLA / 2026</span>
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
