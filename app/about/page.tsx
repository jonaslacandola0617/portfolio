import Link from "next/link";
import { Download } from "lucide-react";
import { JsonLd } from "@/components/shared/json-ld";
import { PageHeader, PageShell } from "@/components/shared/page-header";
import { Tag } from "@/components/shared/tag";
import { getAboutPage } from "@/lib/db/queries/about";
import { getSiteSettings } from "@/lib/db/queries/settings";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { buildProfilePageJsonLd } from "@/lib/structured-data";

export const metadata = buildStaticPageMetadata({
  title: "About | Web Development, IT & Networking",
  description:
    "Learn about Jonas Lacandola's work across web development, IT support, networking, and cybersecurity, including full-stack applications, APIs, technical projects, and hands-on labs.",
  path: "/about",
  keywords: [
    "Jonas Lacandola",
    "web developer portfolio",
    "Laravel developer",
    "PHP developer",
    "React developer",
    "Next.js developer",
    "IT support",
    "networking portfolio",
    "cybersecurity portfolio",
  ],
});

export default async function AboutPage() {
  const [about, settings] = await Promise.all([
    getAboutPage(),
    getSiteSettings(),
  ]);
  const initials = settings.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const profileJsonLd = buildProfilePageJsonLd({
    name: settings.name,
    role: settings.role,
    tagline: settings.tagline,
    email: settings.email,
    githubUrl: settings.githubUrl,
    linkedinUrl: settings.linkedinUrl,
    profileImageUrl: about.profileImageUrl ?? undefined,
    knowsAbout: about.focusTags,
  });

  return (
    <div>
      <JsonLd data={profileJsonLd} />
      <PageHeader index="01" eyebrow="Profile" title="About" />
      <PageShell>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[220px_1fr]">
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border border-border-strong bg-surface-2">
              {about.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={about.profileImageUrl}
                  alt={`${settings.name} profile`}
                  className="h-full w-full object-cover grayscale"
                />
              ) : (
                <span className="font-display text-5xl font-semibold text-cobalt">
                  {initials}
                </span>
              )}
              <div className="pointer-events-none absolute left-3 top-3 h-8 w-8 border border-border" />
              <div className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 bg-vermilion" />
            </div>
            <p className="mt-4 text-xs text-muted">Profile</p>
            <Link
              href="/resume"
              className="mt-5 flex items-center justify-center gap-2 border border-border-strong bg-text px-4 py-2.5 text-sm font-medium text-surface"
            >
              <Download size={14} /> Résumé
            </Link>
          </div>

          <div className="max-w-content">
            <p className="mb-8 border-l-2 border-vermilion pl-5 font-display text-xl leading-snug text-text sm:text-2xl">
              &quot;{about.quote}&quot;
            </p>

            <section className="mb-8">
              <p className="idx mb-2">01 — Background</p>
              <p className="mb-4 text-[15px] leading-relaxed text-text">
                {about.background}
              </p>
            </section>

            <section className="mb-8">
              <p className="idx mb-2">02 — Current Focus</p>
              <p className="mb-4 text-[15px] leading-relaxed text-text">
                {about.currentFocus}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {about.focusTags.map((item) => (
                  <Tag key={item}>{item}</Tag>
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
                {about.whatsNext}
              </p>
            </section>
          </div>
        </div>
      </PageShell>
    </div>
  );
}
