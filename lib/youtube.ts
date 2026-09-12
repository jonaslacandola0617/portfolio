const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

export interface ParsedYouTubeVideo {
  videoId: string;
  watchUrl: string;
  embedUrl: string;
  thumbnailUrl: string;
}

function validVideoId(value: string | null | undefined): value is string {
  return Boolean(value && VIDEO_ID_PATTERN.test(value));
}

export function parseYouTubeUrl(input: string): ParsedYouTubeVideo | null {
  const value = input.trim();
  if (!value) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId: string | null = null;

  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v");
    } else if (parts[0] === "embed" || parts[0] === "shorts") {
      videoId = parts[1] ?? null;
    }
  }

  if (!validVideoId(videoId)) return null;

  return {
    videoId,
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

export function youtubeThumbnailUrl(videoId: string): string | null {
  return validVideoId(videoId) ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function youtubeEmbedUrl(videoId: string): string | null {
  return validVideoId(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
}
