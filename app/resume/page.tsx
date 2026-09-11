import { Download, ExternalLink, FileText, Mail, Github, Linkedin } from "lucide-react";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";

export const metadata = buildStaticPageMetadata({
  title: "Jonas Lacandola Resume | Web Development, IT & Networking",
  description:
    "Review Jonas Lacandola's resume covering web development, IT support, technical support, networking, cybersecurity training, certifications, and hands-on software projects.",
  path: "/resume",
  keywords: [
    "Jonas Lacandola resume",
    "web developer resume",
    "Laravel developer resume",
    "PHP developer resume",
    "React developer resume",
    "IT support resume",
    "technical support resume",
    "networking resume",
    "cybersecurity resume",
  ],
});

export default async function ResumePage() {
  const settings = await getSiteSettings();
  const previewUrl = `${settings.resumeUrl}#view=FitH`;

  return (
    <div className="resume-space">
      <section className="resume-space-hero">
        <span>06 / DOCUMENT</span>
        <h1>Résumé</h1>
        <p>Current experience, technical work, certifications, and the skills I&apos;m actively building.</p>
        <div className="resume-space-actions">
          <a href={settings.resumeUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Open PDF</a>
          <a href={settings.resumeUrl} download><Download size={13}/> Download</a>
        </div>
        <div className="resume-space-geometry" aria-hidden="true"><span/><i/><b/></div>
      </section>

      <section className="resume-space-body">
        <div className="resume-document">
          <div className="resume-document-bar"><FileText size={14}/><span>resume.pdf</span><small>CURRENT DOCUMENT</small></div>
          <object data={previewUrl} type="application/pdf" width="100%" className="resume-pdf-preview">
            <div className="resume-preview-fallback">PDF preview unavailable. Use Open PDF or Download above.</div>
          </object>
          <div className="resume-mobile-fallback">
            <FileText size={32}/><strong>{settings.name}</strong><span>{settings.role}</span>
            <p>Open the PDF for the full résumé on mobile.</p>
            <a href={settings.resumeUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/> Open PDF</a>
          </div>
        </div>

        <aside className="resume-space-aside">
          <div><small>CONTACT</small><a href={`mailto:${settings.email}`}><Mail size={13}/>{settings.email}</a><a href={settings.githubUrl} target="_blank" rel="noreferrer"><Github size={13}/>GitHub</a><a href={settings.linkedinUrl} target="_blank" rel="noreferrer"><Linkedin size={13}/>LinkedIn</a></div>
          <div><small>VIEWING</small><p>The embedded viewer is for quick review. Open the original PDF for the largest reading area.</p></div>
        </aside>
      </section>
    </div>
  );
}
