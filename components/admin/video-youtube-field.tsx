"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseYouTubeUrl } from "@/lib/youtube";

export function VideoYouTubeField({ defaultValue = "", error }: { defaultValue?: string; error?: string }) {
  const [value, setValue] = useState(defaultValue);
  const parsed = useMemo(() => (value.trim() ? parseYouTubeUrl(value) : null), [value]);

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="youtubeUrl">YouTube URL</Label>
        <Input id="youtubeUrl" name="youtubeUrl" type="url" value={value} onChange={(event) => setValue(event.target.value)} placeholder="https://youtube.com/watch?v=…" aria-describedby="youtube-detection" />
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
      {value.trim() &&
        (parsed ? (
          <div id="youtube-detection" className="grid gap-3 border border-teal/30 bg-teal/5 p-3 sm:grid-cols-[128px_1fr]">
            <div className="relative aspect-video overflow-hidden border border-border bg-surface-3">
              <Image src={parsed.thumbnailUrl} alt="Detected YouTube poster" fill sizes="128px" className="object-cover" />
              <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                <Play className="h-5 w-5 fill-current" />
              </span>
            </div>
            <div className="min-w-0 self-center">
              <p className="label text-teal">Video detected</p>
              <p className="mt-1 break-all font-mono text-[10px] text-text-dim">ID {parsed.videoId}</p>
              <p className="mt-1 text-xs text-text-dim">Playback uses the privacy-enhanced YouTube embed only after the visitor presses Play.</p>
            </div>
          </div>
        ) : (
          <p id="youtube-detection" className="border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            Enter a YouTube watch, youtu.be, embed, or Shorts URL.
          </p>
        ))}
    </div>
  );
}
