import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { getVideoDashboardData } from "@/lib/services/video-admin-service";
import { createVideoDraftAction } from "@/app/admin/(dashboard)/video/actions";

function disciplineLabel(values: string[]) {
  if (!values.length) return "Unassigned";
  return values.map((value) => value === "VIDEO_EDITING" ? "Video Editing" : "Cinematography").join(" · ");
}

export default async function AdminVideoPage() {
  const data = await getVideoDashboardData();
  return (
    <div>
      <PageHeader index="05" eyebrow="Creative portfolio." title="Video Portfolio" />
      <PageShell>
        <div className="grid gap-px border border-border bg-border sm:grid-cols-3">
          {[{ label: "Published", value: data.published }, { label: "Draft", value: data.draft }, { label: "Total", value: data.total }].map((metric) => (
            <div key={metric.label} className="bg-surface p-5"><p className="idx">{metric.label}</p><p className="mt-3 font-display text-4xl text-text">{String(metric.value).padStart(2, "0")}</p></div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/admin/video/homepage" className="border border-border-strong px-4 py-2.5 text-sm text-text hover:bg-surface-2">Manage Homepage</Link>
          <form action={createVideoDraftAction}><button className="flex items-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"><Plus className="h-3.5 w-3.5" />New Video</button></form>
        </div>

        <section className="mt-10 border-t border-border pt-5">
          <div className="mb-4 flex items-center justify-between"><p className="idx">Recent work</p><Link href="/admin/video/projects" className="label text-[10px] text-text-dim hover:text-text">Manage all →</Link></div>
          {data.recent.length ? (
            <div className="divide-y divide-border border-y border-border">
              {data.recent.map((item) => <Link key={item.id} href={`/admin/video/projects/${item.id}`} className="grid gap-1 py-3 text-sm hover:bg-surface-2 sm:grid-cols-[1fr_180px_100px] sm:px-3"><span className="font-medium text-text">{item.title}</span><span className="text-text-dim">{disciplineLabel(item.disciplines)}</span><span className="font-mono text-[10px] uppercase text-muted">{item.publishStatus}</span></Link>)}
            </div>
          ) : <div className="border border-dashed border-border px-5 py-10 text-center"><p className="text-sm text-text-dim">No video projects yet.</p><p className="mt-1 text-xs text-muted">Create a draft when you are ready to add the first real piece.</p></div>}
        </section>
      </PageShell>
    </div>
  );
}
