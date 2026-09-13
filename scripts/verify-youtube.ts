import assert from "node:assert/strict";
import { parseYouTubeUrl, youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/youtube";
import { runtimeToIso8601 } from "@/lib/video-format";
import { hasMeaningfulTipTapContent } from "@/lib/editor/content-presence";

const id = "abc123XYZ01";
const supported = [
  `https://www.youtube.com/watch?v=${id}`,
  `https://youtu.be/${id}`,
  `https://www.youtube.com/embed/${id}`,
  `https://www.youtube.com/shorts/${id}`,
];

for (const url of supported) {
  const parsed = parseYouTubeUrl(url);
  assert.ok(parsed, `Expected supported YouTube URL: ${url}`);
  assert.equal(parsed.videoId, id);
  assert.equal(parsed.watchUrl, `https://www.youtube.com/watch?v=${id}`);
  assert.equal(parsed.embedUrl, `https://www.youtube-nocookie.com/embed/${id}`);
  assert.equal(parsed.thumbnailUrl, `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
}

for (const url of [
  "https://vimeo.com/123456",
  "https://youtube.com/watch?v=too-short",
  "javascript:alert(1)",
  "not a url",
]) {
  assert.equal(parseYouTubeUrl(url), null, `Expected rejected URL: ${url}`);
}

assert.equal(youtubeEmbedUrl(id), `https://www.youtube-nocookie.com/embed/${id}`);
assert.equal(youtubeThumbnailUrl(id), `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
assert.equal(runtimeToIso8601("03:42"), "PT3M42S");
assert.equal(runtimeToIso8601("1:02:03"), "PT1H2M3S");
assert.equal(runtimeToIso8601("3:99"), undefined);

assert.equal(hasMeaningfulTipTapContent({ type: "doc", content: [{ type: "paragraph" }] }), false);
assert.equal(hasMeaningfulTipTapContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "  " }] }] }), false);
assert.equal(hasMeaningfulTipTapContent({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "Editing process" }] }] }), true);
assert.equal(hasMeaningfulTipTapContent({ type: "doc", content: [{ type: "mediaImage", attrs: { src: "https://example.com/frame.jpg" } }] }), true);

console.log("[video] youtube, runtime, and optional case-study helpers=ok");
