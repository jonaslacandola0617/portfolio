"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/youtube";

export function VideoPlayer({ videoId, posterUrl, title, priority = false }: { videoId?: string; posterUrl?: string; title: string; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = videoId ? youtubeEmbedUrl(videoId) : null;

  if (playing && embedUrl) {
    return (
      <div className="aspect-video overflow-hidden border border-border bg-black">
        <iframe src={`${embedUrl}?autoplay=1&rel=0`} title={`${title} video player`} className="h-full w-full" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
    );
  }

  return (
    <div className="group relative aspect-video overflow-hidden border border-border bg-surface-3">
      {posterUrl ? (
        <Image src={posterUrl} alt={`${title} poster`} fill sizes="(min-width: 1500px) 1400px, (min-width: 1024px) calc(100vw - 96px), (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)" priority={priority} className="object-cover transition-transform duration-500 ease-signal group-hover:scale-[1.015]" />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-surface-2">
          <span className="idx text-muted">VIDEO / POSTER PENDING</span>
        </div>
      )}
      {embedUrl ? (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Play ${title}`} className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-vermilion">
          <span className="flex h-14 w-14 items-center justify-center border border-[#efe9dc]/80 bg-[#11110f]/75 text-[#efe9dc] backdrop-blur-sm transition-transform duration-200 group-hover:scale-105 sm:h-16 sm:w-16">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </button>
      ) : null}
    </div>
  );
}
