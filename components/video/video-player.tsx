"use client";

import { useState } from "react";
import Image from "next/image";
import { Film, Play } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/youtube";

/** Poster first; the YouTube embed only loads after the visitor presses play. */
export function VideoPlayer({ videoId, posterUrl, title, priority = false }: { videoId?: string; posterUrl?: string; title: string; priority?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const embedUrl = videoId ? youtubeEmbedUrl(videoId) : null;

  if (playing && embedUrl) {
    return (
      <div className="video-frame">
        <iframe src={`${embedUrl}?autoplay=1&rel=0`} title={`${title} video player`} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
      </div>
    );
  }

  return (
    <div className="video-frame is-poster">
      {posterUrl ? (
        <Image src={posterUrl} alt={`${title} poster`} fill sizes="(min-width: 1300px) 1240px, 100vw" priority={priority} />
      ) : (
        <span className="video-frame-empty"><Film size={22} aria-hidden="true" /> Poster coming soon</span>
      )}
      {embedUrl ? (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Play ${title}`} className="video-play">
          <span><Play aria-hidden="true" /></span>
        </button>
      ) : null}
    </div>
  );
}
