import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";
import { CopyEmail, LocalTime } from "@/components/site/interactive";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Contact Jonas Lacandola | Web Development, IT & Technical Roles",
  description:
    "Contact Jonas Lacandola about web development, PHP and Laravel, React and Next.js, IT support, technical support, networking, cybersecurity, and other technical opportunities in the Philippines or remote.",
  path: "/contact",
  keywords: [
    "web developer Philippines",
    "Laravel developer Philippines",
    "PHP developer Philippines",
    "React developer Philippines",
    "Next.js developer Philippines",
    "IT support Philippines",
    "technical support Philippines",
    "networking Philippines",
    "cybersecurity Philippines",
    "Jonas Lacandola contact",
  ],
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <div className="contact-wrap">
      <section>
        <p className="eyebrow"><span className="pulse-dot" aria-hidden="true" /> Open to new roles · remote or on-site</p>
        <h1>Let&apos;s work <span>together.</span></h1>
        <p className="hero-lede">
          Hiring for web development, IT support, or a broader technical role? Have a project that needs building?
          Send a message — I read every one.
        </p>

        <div className="contact-direct">
          <a href={`mailto:${settings.email}`}><span><Mail size={16} /> {settings.email}</span><ArrowUpRight size={16} /></a>
          <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><span><Linkedin size={16} /> LinkedIn</span><ArrowUpRight size={16} /></a>
          <a href={settings.githubUrl} target="_blank" rel="noreferrer"><span><Github size={16} /> GitHub</span><ArrowUpRight size={16} /></a>
        </div>

        <div className="hero-actions">
          <CopyEmail email={settings.email} label="Copy email address" className="btn btn-ghost btn-sm" />
          <LocalTime />
        </div>
        <p className="footer-note" style={{ marginTop: 16 }}>Usually replies within 1–2 business days.</p>
      </section>

      <section className="contact-form-card" aria-labelledby="contact-form-title">
        <h2 id="contact-form-title">Send a message</h2>
        <ContactForm />
      </section>
    </div>
  );
}
