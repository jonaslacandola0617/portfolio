import type { Metadata } from "next";
import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { aboutPageStaticCopy } from "@/lib/about-defaults";
import { getAboutPage } from "@/lib/db/queries/about";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const [about, settings] = await Promise.all([getAboutPage(), getSiteSettings()]);
  const initials = settings.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <div>
      <PageHeader index="01" eyebrow="Profile" title="About" />
      <PageShell>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative flex aspect-square w-full items-center justify-center border border-border-strong bg-surface-2">
              <div className="absolute left-3 top-3 h-8 w-8 border border-border" />
              <span className="font-display text-5xl font-semibold text-cobalt">
                {initials}
              </span>
              <div className="absolute bottom-3 right-3 h-3 w-3 bg-vermilion" />
            </div>
            <p className="mt-4 text-xs text-muted">
              Geometric identity placeholder — no portrait on file.
            </p>
            <Link
              href="/resume"
              className="mt-5 flex items-center justify-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"
            >
              <Download size={14} /> Résumé
            </Link>
          </div>

          <div className="max-w-content">
            <p className="mb-8 border-l-2 border-vermilion pl-5 font-display text-xl leading-snug text-text sm:text-2xl">
              &quot;{aboutPageStaticCopy.quote}&quot;
            </p>

            <section className="mb-8">
              <p className="idx mb-2">01 — Background</p>
              <p className="mb-4 text-[15px] leading-relaxed text-text">
                {about.biography}
              </p>
            </section>

            <section className="mb-8">
              <p className="idx mb-2">02 — Current Focus</p>
              <p className="mb-4 text-[15px] leading-relaxed text-text">
                {about.currentFocus}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {siteConfig.currentFocusStack.map((item) => (
                  <span
                    key={item}
                    className="label border border-border px-1.5 py-0.5 text-muted"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>

            <section className="mb-8">
              <p className="idx mb-2">03 — Learning Philosophy</p>
              <p className="text-[15px] leading-relaxed text-text">
                {about.learningPhilosophy}
              </p>
            </section>

            <section>
              <p className="idx mb-2">04 — What&apos;s Next</p>
              <p className="text-[15px] leading-relaxed text-text">
                {aboutPageStaticCopy.whatsNext}
              </p>
            </section>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
