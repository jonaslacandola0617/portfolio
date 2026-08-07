import type { Metadata } from "next";
import { Download, FileText, Mail, Github, Linkedin } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumePage() {
  const settings = await getSiteSettings();
  return (
    <div>
      <PageHeader index="06" eyebrow="Document" title="Résumé" description="Current résumé, kept up to date as certifications and projects progress." />
      <PageShell>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]">
          <div className="border border-border-strong bg-surface-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2"><FileText size={14} className="text-cobalt"/><span className="font-mono text-xs text-text-dim">resume.pdf</span></div>
              <span className="label">Current document</span>
            </div>
            <object data={settings.resumeUrl} type="application/pdf" width="100%" height="900" className="hidden bg-paper sm:block">
              <div className="p-10 text-sm text-text-dim">PDF preview unavailable. Use the download action.</div>
            </object>
            <div className="flex aspect-[8.5/11] items-center justify-center bg-paper p-10 text-center text-ink sm:hidden">
              <div><FileText size={34} className="mx-auto mb-4"/><p className="font-display text-xl font-semibold">{settings.name}</p><p className="mt-1 font-mono text-xs uppercase tracking-wide text-charcoal">{settings.role}</p><p className="mt-8 text-sm text-charcoal">Open the full PDF using the download action.</p></div>
            </div>
          </div>
          <aside className="space-y-4">
            <a href={settings.resumeUrl} download className="flex items-center justify-center gap-2 border border-border-strong bg-text px-4 py-3 text-sm font-medium text-surface"><Download size={15}/> Download PDF</a>
            <div className="border border-border bg-surface-2 p-4">
              <p className="label mb-3">Contact</p>
              <div className="space-y-2 text-sm">
                <a href={`mailto:${settings.email}`} className="flex items-center gap-2 text-text-dim hover:text-text"><Mail size={13}/> {settings.email}</a>
                <a href={settings.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-dim hover:text-text"><Github size={13}/> GitHub</a>
                <a href={settings.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-text-dim hover:text-text"><Linkedin size={13}/> LinkedIn</a>
              </div>
            </div>
          </aside>
        </div>
      </PageShell>
    </div>
  );
}
