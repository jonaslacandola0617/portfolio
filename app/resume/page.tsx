import Link from "next/link";
import { Download, ExternalLink, FileText, Github, Linkedin, Mail } from "lucide-react";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Jonas Lacandola Resume | IT Support, Networking & Cybersecurity",
  description:
    "Review Jonas Lacandola's resume covering IT support, technical support, networking, cybersecurity training, certifications, hands-on labs, and software projects.",
  path: "/resume",
  keywords: [
    "Jonas Lacandola resume",
    "IT support resume",
    "technical support resume",
    "help desk resume",
    "network administrator resume",
    "networking resume",
    "cybersecurity resume",
    "SOC analyst resume",
  ],
});

export default async function ResumePage() {
  const settings = await getSiteSettings();
  const previewUrl = `${settings.resumeUrl}#view=FitH`;

  return (
    <div className="resume-wrap">
      <header className="resume-head">
        <div>
          <p className="eyebrow"><span className="eyebrow-index">Résumé</span>{settings.role}</p>
          <h1>{settings.name}</h1>
          <p>Experience, technical work, certifications, and the skills I&apos;m actively building — on one page.</p>
        </div>
        <div className="resume-actions">
          <a href={settings.resumeUrl} download className="btn btn-solid"><Download size={15} /> Download PDF</a>
          <a href={settings.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-ghost"><ExternalLink size={15} /> Open in new tab</a>
        </div>
      </header>

      <section className="resume-body">
        <div className="resume-doc">
          <div className="browser-bar">
            <span className="browser-dots"><i /><i /><i /></span>
            <span className="browser-url">resume.pdf</span>
          </div>
          <object data={previewUrl} type="application/pdf" aria-label={`${settings.name} résumé`}>
            <div className="resume-doc-fallback">
              <FileText size={28} />
              <p>The inline preview isn&apos;t available in this browser.</p>
              <a href={settings.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-solid btn-sm">Open the PDF</a>
            </div>
          </object>
          <div className="resume-doc-fallback">
            <FileText size={28} />
            <strong>{settings.name}</strong>
            <p className="muted">{settings.role}</p>
            <a href={settings.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-solid btn-sm"><ExternalLink size={14} /> Open the PDF</a>
          </div>
        </div>

        <aside className="resume-aside">
          <section>
            <p className="footer-label">Contact</p>
            <a href={`mailto:${settings.email}`}><Mail size={14} /> {settings.email}</a>
            <a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={14} /> LinkedIn</a>
            <a href={settings.githubUrl} target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
          </section>
          <section>
            <p className="footer-label">Proof of work</p>
            <p>The labs and certifications on my résumé are documented here, step by step.</p>
            <Link href="/labs" className="btn btn-ghost btn-sm">Browse labs</Link>
          </section>
        </aside>
      </section>
    </div>
  );
}
