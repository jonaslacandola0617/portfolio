import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";
import { CopyEmail, LocalTime } from "@/components/site/interactive";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Contact Jonas Lacandola | IT Support, Networking & Cybersecurity Roles",
  description:
    "Contact Jonas Lacandola about IT support, help desk, network administration, cybersecurity, and other technical roles in the Philippines or remote.",
  path: "/contact",
  keywords: [
    "IT support Philippines",
    "technical support Philippines",
    "help desk Philippines",
    "network administrator Philippines",
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
        <p className="eyebrow"><span className="pulse-dot" aria-hidden="true" /> Open to IT help desk &amp; technical support · remote or on-site in Clark / Pampanga · night shift OK</p>
        <h1>Let&apos;s work <span>together.</span></h1>
        <p className="hero-lede">
          Hiring for IT help desk, desktop support or technical support? I&apos;d like to hear about it.
          Send a message here or email me directly. I read everything and reply quickly.
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
