import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { Tag } from "@/components/shared/tag";
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
    <div className="about-space">
      <JsonLd data={profileJsonLd} />

      <section className="about-space-hero">
        <div className="about-space-number">01 / ABOUT</div>
        <div className="about-space-copy">
          <p className="about-space-kicker">WEB DEVELOPER / TECHNICAL PROBLEM SOLVER</p>
          <h1>I like <em>understanding</em> how things work.</h1>
          <p>{settings.tagline}</p>
          <div className="about-space-actions">
            <Link href="/resume"><Download size={14}/> Résumé</Link>
            <Link href="/contact">Contact <ArrowUpRight size={14}/></Link>
          </div>
        </div>
        <div className="about-space-profile">
          {about.profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={about.profileImageUrl} alt={`${settings.name} profile`} />
          ) : (
            <span>{initials}</span>
          )}
          <i aria-hidden="true" /><b aria-hidden="true" />
        </div>
      </section>

      <section className="about-space-philosophy">
        <div className="about-philosophy-label">HOW I LEARN</div>
        <div className="about-philosophy-words"><span>Build.</span><span>Break.</span><span>Rebuild.</span></div>
        <p>{about.learningPhilosophy}</p>
      </section>

      <section className="about-space-grid">
        <article>
          <small>01 / BACKGROUND</small>
          <p>{about.background}</p>
        </article>
        <article>
          <small>02 / CURRENT FOCUS</small>
          <p>{about.currentFocus}</p>
          <div className="about-focus-tags">{about.focusTags.map((item) => <Tag key={item}>{item}</Tag>)}</div>
        </article>
        <article>
          <small>03 / WHAT&apos;S NEXT</small>
          <p>{about.whatsNext}</p>
        </article>
        <blockquote>“{about.quote}”</blockquote>
      </section>
    </div>
  );
}
