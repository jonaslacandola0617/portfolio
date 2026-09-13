import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
import { getPublishedVideoProjects, getVideoPortfolioSettings } from "@/lib/db/queries/video";
import { buildStaticPageMetadata } from "@/lib/metadata";
import { hasMeaningfulTipTapContent } from "@/lib/editor/content-presence";
import { videoDisciplineLine, videoYear } from "@/lib/video-format";

export const metadata = buildStaticPageMetadata({
  title: "Video Editing & Cinematography",
  description: "Video editing and cinematography portfolio by Jonas Lacandola — selected work, visual storytelling, editing decisions, and optional process case studies.",
  path: "/video",
  keywords: ["video editor portfolio", "cinematography portfolio", "video editing", "cinematography", "visual storytelling"],
});

export default async function VideoHomepage() {
  const [settings, projects] = await Promise.all([getVideoPortfolioSettings(), getPublishedVideoProjects()]);
  const byId = new Map(projects.map((project) => [project.id, project]));
  const hero = settings.heroVideoId ? byId.get(settings.heroVideoId) : undefined;
  const featured = settings.featuredVideoIds.map((id) => byId.get(id)).filter((project): project is NonNullable<typeof project> => Boolean(project));

  return (
    <div>
      <section className="mx-auto grid max-w-[1500px] gap-10 border-b border-border px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(520px,1.2fr)] lg:items-end lg:px-12 lg:py-24">
        <div className="max-w-3xl">
          <p className="idx text-vermilion">{settings.eyebrow}</p>
          <h1 className="mt-5 font-display text-[clamp(3rem,8vw,8rem)] leading-[0.88] tracking-[-0.045em] text-text">{settings.headline}</h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-text-dim sm:text-lg">{settings.intro}</p>
          <Link href="/video/work" className="label mt-8 inline-flex items-center gap-2 border border-border-strong bg-text px-4 py-3 text-xs text-surface transition-opacity hover:opacity-85">View Work <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
        {hero ? <VideoPlayer videoId={hero.youtubeVideoId} posterUrl={hero.customPosterUrl} title={hero.title} priority /> : null}
      </section>

      <section className="mx-auto grid max-w-[1500px] gap-8 border-b border-border px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[260px_1fr] lg:px-12">
        <p className="idx">02 / ABOUT</p>
        <div className="max-w-4xl"><h2 className="font-display text-4xl leading-tight text-text sm:text-6xl">{settings.aboutHeading}</h2><p className="mt-6 max-w-3xl text-base leading-7 text-text-dim sm:text-lg">{settings.aboutBody}</p></div>
      </section>

      <section className="mx-auto max-w-[1500px] border-b border-border px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
        <p className="idx mb-7">03 / DISCIPLINES</p>
        <div className="grid gap-px border border-border bg-border lg:grid-cols-2">
          <article className="min-h-[280px] bg-surface p-6 sm:p-8"><p className="idx text-vermilion">01 / VIDEO EDITING</p><h2 className="mt-12 font-display text-4xl text-text sm:text-5xl">Editing</h2><p className="mt-5 max-w-lg text-sm leading-6 text-text-dim sm:text-base">{settings.videoEditingDescription}</p></article>
          <article className="min-h-[280px] bg-surface p-6 sm:p-8"><p className="idx text-vermilion">02 / CINEMATOGRAPHY</p><h2 className="mt-12 font-display text-4xl text-text sm:text-5xl">Cinematography</h2><p className="mt-5 max-w-lg text-sm leading-6 text-text-dim sm:text-base">{settings.cinematographyDescription}</p></article>
        </div>
      </section>

      {featured.length ? (
        <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 sm:py-20 lg:px-12">
          <div className="mb-10 flex items-end justify-between gap-6"><div><p className="idx">04 / FEATURED WORK</p><h2 className="mt-3 font-display text-4xl text-text sm:text-6xl">Selected video work</h2></div><Link href="/video/work" className="label hidden items-center gap-2 text-[10px] text-text-dim hover:text-text sm:flex">View all <ArrowRight className="h-3 w-3" /></Link></div>
          <div className="space-y-16 sm:space-y-24">
            {featured.map((project, index) => {
              const hasCaseStudy = hasMeaningfulTipTapContent(project.content);
              return <article key={project.id} className="grid items-center gap-7 lg:grid-cols-2 lg:gap-12">
                <div className={index % 2 ? "lg:order-2" : undefined}><VideoPlayer videoId={project.youtubeVideoId} posterUrl={project.customPosterUrl} title={project.title} /></div>
                <div className={index % 2 ? "lg:order-1" : undefined}>
                  <p className="idx text-vermilion">{String(index + 1).padStart(2, "0")} / {videoDisciplineLine(project.disciplines).toUpperCase()}</p>
                  <h3 className="mt-4 font-display text-4xl leading-tight text-text sm:text-5xl">{project.title}</h3>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-text-dim sm:text-base">{project.summary}</p>
                  <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{[videoYear(project.completionDate), project.runtime].filter(Boolean).join(" · ") || (hasCaseStudy ? "CASE STUDY" : "VIDEO PROJECT")}</p>
                  <Link href={`/video/${project.slug}`} className="label mt-6 inline-flex items-center gap-2 border-b border-border-strong pb-1 text-xs text-text">{hasCaseStudy ? "View case study" : "View project"} <ArrowRight className="h-3 w-3" /></Link>
                </div>
              </article>;
            })}
          </div>
          <Link href="/video/work" className="label mt-12 inline-flex items-center gap-2 border border-border-strong px-4 py-3 text-xs text-text sm:hidden">View all work <ArrowRight className="h-3 w-3" /></Link>
        </section>
      ) : (
        <section className="mx-auto max-w-[1500px] px-5 py-14 sm:px-8 lg:px-12"><div className="border-t border-border pt-8"><p className="idx">04 / FEATURED WORK</p><p className="mt-4 max-w-xl text-sm leading-6 text-text-dim">Published video projects will appear here once they are selected in the Video homepage editor.</p><Link href="/video/work" className="label mt-5 inline-flex items-center gap-2 text-xs text-text">View work archive <ArrowRight className="h-3 w-3" /></Link></div></section>
      )}
    </div>
  );
}
