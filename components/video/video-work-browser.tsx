"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List as ListIcon } from "lucide-react";
import { VideoPlayer } from "@/components/video/video-player";
import { cn } from "@/lib/utils";

export interface VideoWorkItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  youtubeVideoId?: string;
  customPosterUrl?: string;
  discipline: string;
  meta: string;
  linkLabel: string;
}

type ViewMode = "grid" | "list";

export function VideoWorkBrowser({ projects }: { projects: VideoWorkItem[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <>
      <div className="work-index-toolbar">
        <span className="work-index-count">{projects.length} {projects.length === 1 ? "video" : "videos"}</span>
        <div className="segmented" role="group" aria-label="Layout">
          <button type="button" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}><LayoutGrid size={14} aria-hidden="true" /> Grid</button>
          <button type="button" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}><ListIcon size={14} aria-hidden="true" /> List</button>
        </div>
      </div>

      <div className={cn("video-grid", viewMode === "list" && "is-list")}>
        {projects.map((project, index) => (
          <article key={project.id} className="video-card">
            <VideoPlayer videoId={project.youtubeVideoId} posterUrl={project.customPosterUrl} title={project.title} />
            <div className="video-card-copy">
              <p className="work-meta">
                <span className="work-index">{String(index + 1).padStart(2, "0")}</span>
                <span>{project.discipline}</span>
                {project.meta ? <span>{project.meta}</span> : null}
              </p>
              <h2>{project.title}</h2>
              {viewMode === "list" ? <p className="video-card-summary">{project.summary}</p> : null}
              <Link href={`/video/${project.slug}`} className="text-link">{project.linkLabel} <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
