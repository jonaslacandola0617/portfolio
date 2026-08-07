import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { Tag } from "@/components/shared/tag";
import { getAboutPage } from "@/lib/db/queries/about";
import { getSiteSettings } from "@/lib/db/queries/settings";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const [about, settings] = await Promise.all([getAboutPage(), getSiteSettings()]);
  const initials = settings.name.split(" ").map((word) => word[0]).join("").toUpperCase();
  return (
    <div>
      <PageHeader index="01" eyebrow="Profile" title="About" description={about.description} />
      <PageShell>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative flex aspect-square w-full items-center justify-center border border-border-strong bg-surface-2">
              <div className="absolute left-3 top-3 h-8 w-8 border border-border" />
              <span className="font-display text-5xl font-semibold text-cobalt">{initials}</span>
              <div className="absolute bottom-3 right-3 h-3 w-3 bg-vermilion" />
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Geometric identity marker.</p>
            <Link href="/resume" className="mt-5 flex items-center justify-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"><Download size={14}/> Résumé</Link>
          </div>
          <div className="max-w-content">
            <p className="mb-8 border-l-2 border-vermilion pl-5 font-display text-xl leading-snug text-text sm:text-2xl">{about.title}</p>
            {about.paragraphs.map((paragraph, i) => (
              <section className="mb-8" key={paragraph}>
                <p className="idx mb-2">{String(i + 1).padStart(2, "0")} — {i === 0 ? "Background" : i === 1 ? "Current Focus" : "Learning Philosophy"}</p>
                <p className="text-[15px] leading-relaxed text-text">{paragraph}</p>
              </section>
            ))}
            <section>
              <p className="idx mb-2">04 — {about.focusLabel}</p>
              <div className="flex flex-wrap gap-1.5">{about.currentFocus.map((item) => <Tag key={item}>{item}</Tag>)}</div>
            </section>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
