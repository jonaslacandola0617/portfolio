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
    <div className="video-home">
      <section className="video-hero">
        <div>
          <p className="eyebrow"><span className="eyebrow-index">Video</span>{settings.eyebrow}</p>
          <h1>{settings.headline}</h1>
          <p className="hero-lede">{settings.intro}</p>
          <div className="hero-actions">
            <Link href="/video/work" className="btn btn-solid">All videos <ArrowRight size={15} /></Link>
          </div>
        </div>
        {hero ? <VideoPlayer videoId={hero.youtubeVideoId} posterUrl={hero.customPosterUrl} title={hero.title} priority /> : null}
      </section>

      {featured.length ? (
        <section className="section" aria-labelledby="featured-video-title">
          <div className="section-head">
            <p className="eyebrow"><span className="eyebrow-index">01</span>Featured</p>
            <h2 id="featured-video-title">Selected work.</h2>
            <div className="section-head-aside"><Link href="/video/work" className="text-link">All videos <ArrowRight size={15} /></Link></div>
          </div>
          <div className="work-list">
            {featured.map((project, index) => {
              const hasCaseStudy = hasMeaningfulTipTapContent(project.content);
              const meta = [videoYear(project.completionDate), project.runtime].filter(Boolean).join(" · ");
              return (
                <article key={project.id} className="work-item">
                  <div className="work-media"><VideoPlayer videoId={project.youtubeVideoId} posterUrl={project.customPosterUrl} title={project.title} /></div>
                  <div className="work-copy">
                    <p className="work-meta">
                      <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
                      <span>{videoDisciplineLine(project.disciplines)}</span>
                      {meta ? <span>{meta}</span> : null}
                    </p>
                    <h3><Link href={`/video/${project.slug}`}>{project.title}</Link></h3>
                    <p className="work-summary">{project.summary}</p>
                    <div className="work-actions">
                      <Link href={`/video/${project.slug}`} className="btn btn-ghost btn-sm">{hasCaseStudy ? "Read case study" : "Details"} <ArrowRight size={14} /></Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="section" aria-labelledby="disciplines-title">
        <div className="section-head">
          <p className="eyebrow"><span className="eyebrow-index">{featured.length ? "02" : "01"}</span>What I do</p>
          <h2 id="disciplines-title">Two sides of the same craft.</h2>
        </div>
        <div className="outside-grid video-disciplines">
          <article className="outside-card"><h3>Video editing</h3><p>{settings.videoEditingDescription}</p></article>
          <article className="outside-card"><h3>Cinematography</h3><p>{settings.cinematographyDescription}</p></article>
        </div>
      </section>
    </div>
  );
}
