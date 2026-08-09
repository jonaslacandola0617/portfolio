import { Mail, Github, Linkedin } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { ContactForm } from "@/components/shared/contact-form";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Contact | Cybersecurity & Networking Opportunities",
  description:
    "Contact Jonas Lacandola about entry-level cybersecurity, SOC, network administration, IT support, and technical opportunities in the Philippines or remote.",
  path: "/contact",
  keywords: [
    "cybersecurity analyst Philippines",
    "SOC analyst Philippines",
    "network administrator Philippines",
    "IT support Philippines",
    "Jonas Lacandola contact",
  ],
});

export default async function ContactPage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <PageHeader
        index="07"
        eyebrow="Reach Out"
        title="Contact"
        description="Open to entry-level SOC, network administration, and IT support roles — remote or on-site."
      />
      <PageShell>
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
          <ContactForm />
          <aside className="space-y-3">
            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-3 border border-border bg-surface-2 px-4 py-3.5 text-sm text-text-dim hover:text-text"
            >
              <Mail size={15} className="text-cobalt" />
              {settings.email}
            </a>
            <a
              href={settings.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border border-border bg-surface-2 px-4 py-3.5 text-sm text-text-dim hover:text-text"
            >
              <Linkedin size={15} className="text-cobalt" />
              LinkedIn Profile
            </a>
            <a
              href={settings.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 border border-border bg-surface-2 px-4 py-3.5 text-sm text-text-dim hover:text-text"
            >
              <Github size={15} className="text-cobalt" />
              GitHub Profile
            </a>
            <div className="border border-border bg-surface-2 px-4 py-3.5">
              <p className="label mb-1">Response expectation</p>
              <p className="text-sm text-text-dim">Typically within 1–2 business days.</p>
            </div>
          </aside>
        </div>
      </PageShell>
    </div>
  );
}
