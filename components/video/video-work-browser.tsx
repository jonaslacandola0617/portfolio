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
      <div className="mb-10 flex items-center justify-between border-y border-border py-3 sm:mb-14">
        <p className="idx">VIEW</p>
        <div className="flex items-center gap-2" role="group" aria-label="Project layout">
          <button
            type="button"
            aria-pressed={viewMode === "grid"}
            onClick={() => setViewMode("grid")}
            className={cn(
              "label inline-flex h-9 items-center gap-2 border px-3 text-[10px] transition-colors",
              viewMode === "grid"
                ? "border-border-strong bg-text !text-surface"
                : "border-border text-text-dim hover:border-border-strong hover:text-text",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
            Grid
          </button>
          <button
            type="button"
            aria-pressed={viewMode === "list"}
            onClick={() => setViewMode("list")}
            className={cn(
              "label inline-flex h-9 items-center gap-2 border px-3 text-[10px] transition-colors",
              viewMode === "list"
                ? "border-border-strong bg-text !text-surface"
                : "border-border text-text-dim hover:border-border-strong hover:text-text",
            )}
          >
            <ListIcon className="h-3.5 w-3.5" aria-hidden="true" />
            List
          </button>
        </div>
      </div>

      <div
        className={cn(
          viewMode === "grid"
            ? "grid gap-x-8 gap-y-14 lg:grid-cols-2 lg:gap-y-20"
            : "space-y-12 sm:space-y-16",
        )}
      >
        {projects.map((project, index) => (
          <article
            key={project.id}
            className={cn(
              viewMode === "list" &&
                "grid gap-6 border-b border-border pb-12 sm:pb-16 lg:grid-cols-[minmax(360px,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-10",
            )}
          >
            <VideoPlayer
              videoId={project.youtubeVideoId}
              posterUrl={project.customPosterUrl}
              title={project.title}
            />
            <div className={cn("border-t border-border pt-4", viewMode === "grid" && "mt-4")}>
              <p className="idx text-vermilion">
                {String(index + 1).padStart(2, "0")} / {project.discipline}
              </p>
              <h2
                className={cn(
                  "mt-2 font-display leading-tight text-text",
                  viewMode === "grid" ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl",
                )}
              >
                {project.title}
              </h2>
              {viewMode === "list" ? (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-text-dim sm:text-base">
                  {project.summary}
                </p>
              ) : null}
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  {project.meta}
                </p>
                <Link
                  href={`/video/${project.slug}`}
                  className="label flex items-center gap-2 text-[10px] text-text-dim hover:text-text"
                >
                  {project.linkLabel} <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
