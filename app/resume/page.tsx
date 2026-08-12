import {
  Download,
  ExternalLink,
  FileText,
  Mail,
  Github,
  Linkedin,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
    <div>
      <PageHeader
        index="06"
        eyebrow="Document"
        title="Résumé"
        description="Current résumé, kept up to date as certifications and projects progress."
      />

      <div className="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 xl:px-10">
        <div className="mb-4 flex flex-col gap-3 border border-border bg-surface-2 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <FileText size={14} className="shrink-0 text-cobalt" />
            <span className="truncate font-mono text-xs text-text-dim">
              resume.pdf
            </span>
            <span className="hidden label sm:inline">Current document</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={settings.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-border-strong px-3 py-2 text-xs font-medium text-text transition-colors hover:bg-surface-3"
            >
              <ExternalLink size={13} /> Open PDF
            </a>
            <a
              href={settings.resumeUrl}
              download
              className="inline-flex items-center justify-center gap-2 border border-border-strong bg-text px-3 py-2 text-xs font-medium text-surface"
            >
              <Download size={13} /> Download PDF
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_260px]">
          <div className="min-w-0 border border-border-strong bg-surface-2">
            <object
              data={previewUrl}
              type="application/pdf"
              width="100%"
              className="hidden h-[calc(100vh-5rem)] min-h-[780px] max-h-[1180px] bg-paper sm:block"
            >
              <div className="p-10 text-sm text-text-dim">
                PDF preview unavailable. Use Open PDF or Download PDF above.
              </div>
            </object>

            <div className="flex aspect-[8.5/11] items-center justify-center bg-paper p-10 text-center text-ink sm:hidden">
              <div>
                <FileText size={34} className="mx-auto mb-4" />
                <p className="font-display text-xl font-semibold">{settings.name}</p>
                <p className="mt-1 font-mono text-xs uppercase tracking-wide text-charcoal">
                  {settings.role}
                </p>
                <p className="mt-8 text-sm text-charcoal">
                  Open the full résumé PDF to view the document on mobile.
                </p>
                <a
                  href={settings.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 border border-ink px-4 py-2 text-sm font-medium"
                >
                  <ExternalLink size={14} /> Open PDF
                </a>
              </div>
            </div>
          </div>

          <aside className="grid gap-4 sm:grid-cols-2 2xl:block 2xl:space-y-4">
            <div className="border border-border bg-surface-2 p-4">
              <p className="label mb-3">Contact</p>
              <div className="space-y-2 text-sm">
                <a
                  href={`mailto:${settings.email}`}
                  className="flex min-w-0 items-center gap-2 text-text-dim hover:text-text"
                >
                  <Mail size={13} className="shrink-0" />
                  <span className="truncate">{settings.email}</span>
                </a>
                <a
                  href={settings.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-text-dim hover:text-text"
                >
                  <Github size={13} /> GitHub
                </a>
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-text-dim hover:text-text"
                >
                  <Linkedin size={13} /> LinkedIn
                </a>
              </div>
            </div>

            <div className="border border-border bg-surface-2 p-4">
              <p className="label mb-2">Viewing tip</p>
              <p className="text-xs leading-5 text-text-dim">
                The embedded viewer is for quick review. Open the PDF for the
                browser&apos;s largest reading area or download the original document.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
