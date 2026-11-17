import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { getAboutPage } from "@/lib/db/queries/about";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildProfilePageJsonLd } from "@/lib/structured-data";

export const metadata = buildStaticPageMetadata({
  title: "About | Web Development, IT & Networking",
  description:
    "Learn about Jonas Lacandola's work across web development, IT support, networking, and cybersecurity, including full-stack applications, APIs, technical projects, and hands-on labs.",
  path: "/about",
  keywords: [
    "Jonas Lacandola",
    "web developer portfolio",
    "Laravel developer",
    "PHP developer",
    "React developer",
    "Next.js developer",
    "IT support",
    "networking portfolio",
    "cybersecurity portfolio",
  ],
});

export default async function AboutPage() {
  const [about, settings] = await Promise.all([getAboutPage(), getSiteSettings()]);
  const initials = settings.name.split(" ").map((word) => word[0]).join("").toUpperCase();
  const profileJsonLd = buildProfilePageJsonLd({
    name: settings.name,
    role: settings.role,
    tagline: settings.tagline,
    email: settings.email,
    githubUrl: settings.githubUrl,
    linkedinUrl: settings.linkedinUrl,
    profileImageUrl: about.profileImageUrl ?? undefined,
    knowsAbout: about.focusTags,
  });

  return (
    <div className="about">
      <JsonLd data={profileJsonLd} />

      <section className="about-hero">
        <div>
          <p className="eyebrow"><span className="eyebrow-index">About</span>{settings.role}</p>
          <h1>I like <em>understanding</em> how things work — then making them work better.</h1>
          <p className="hero-lede">{settings.tagline}</p>
          <div className="hero-actions">
            <Link href="/resume" className="btn btn-solid"><FileText size={15} /> Résumé</Link>
            <Link href="/contact" className="btn btn-ghost">Get in touch <ArrowUpRight size={15} /></Link>
            <Link href="/projects" className="btn btn-link">See my work <ArrowUpRight size={15} /></Link>
          </div>
        </div>
        <figure className="about-portrait">
          {about.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={about.profileImageUrl} alt={`Portrait of ${settings.name}`} />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
          <figcaption><span className="status-pill"><span className="pulse-dot" aria-hidden="true" /> Open to work</span></figcaption>
        </figure>
      </section>

      <blockquote className="about-quote">{about.quote}</blockquote>

      <section className="about-grid">
        <article>
          <p className="eyebrow"><span className="eyebrow-index">01</span>Background</p>
          <h2>Where I&apos;m coming from</h2>
          <p>{about.background}</p>
        </article>
        <article>
          <p className="eyebrow"><span className="eyebrow-index">02</span>Focus</p>
          <h2>What I work with</h2>
          <p>{about.currentFocus}</p>
          {about.focusTags.length ? <ul className="chip-list">{about.focusTags.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        </article>
        <article>
          <p className="eyebrow"><span className="eyebrow-index">03</span>How I work</p>
          <h2>Build, break, rebuild</h2>
          <p>{about.learningPhilosophy}</p>
        </article>
        <article>
          <p className="eyebrow"><span className="eyebrow-index">04</span>Next</p>
          <h2>What I&apos;m looking for</h2>
          <p>{about.whatsNext}</p>
        </article>
      </section>
    </div>
  );
}
