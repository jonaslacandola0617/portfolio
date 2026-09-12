import Link from "next/link";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { createVideoDraftAction } from "@/app/admin/(dashboard)/video/actions";

export default function NewVideoProjectPage() {
  return (
    <div>
      <PageHeader index="05.02" eyebrow="Write first, metadata later." title="New Video" />
      <PageShell>
        <div className="max-w-2xl border border-border bg-surface p-6 sm:p-8">
          <p className="font-display text-2xl text-text">Start with a safe draft.</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-text-dim">This creates an unpublished Video project and opens the existing rich-text editor immediately. YouTube, disciplines, poster, roles, runtime, and client details can be added afterward.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={createVideoDraftAction}><button className="border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface">Create draft & open editor</button></form>
            <Link href="/admin/video/projects" className="border border-border px-4 py-2.5 text-sm text-text-dim hover:text-text">Cancel</Link>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
