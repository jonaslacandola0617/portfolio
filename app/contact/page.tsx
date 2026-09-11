import { ArrowUpRight, Github, Linkedin, Mail } from "lucide-react";
import { ContactForm } from "@/components/shared/contact-form";
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
    <div className="contact-space">
      <section className="contact-space-hero">
        <span className="contact-space-index">07 / CONTACT</span>
        <h1>What should we <em>build</em> next?</h1>
        <p>Open to web development, IT support, technical support, networking, cybersecurity, and broader technical opportunities — remote or on-site.</p>
        <div className="contact-space-line" aria-hidden="true"><span /></div>
      </section>

      <section className="contact-space-body">
        <div className="contact-space-form">
          <div className="contact-space-label">SEND A MESSAGE</div>
          <ContactForm />
        </div>

        <aside className="contact-space-links">
          <span>DIRECT</span>
          <a href={`mailto:${settings.email}`}><Mail size={14}/><strong>{settings.email}</strong><ArrowUpRight size={13}/></a>
          <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={14}/><strong>LinkedIn</strong><ArrowUpRight size={13}/></a>
          <a href={settings.githubUrl} target="_blank" rel="noreferrer"><Github size={14}/><strong>GitHub</strong><ArrowUpRight size={13}/></a>
          <div className="contact-space-response"><small>RESPONSE</small><p>Typically within 1–2 business days.</p></div>
        </aside>
      </section>
    </div>
  );
}
