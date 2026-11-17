import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS (it ignores SVG favicons). Same mark as app/icon.svg. */
export default function AppleIcon() {
  const dot = (left: number, top: number, color: string) => (
    <div style={{ position: "absolute", left: left - 20, top: top - 20, width: 40, height: 40, borderRadius: 20, background: color }} />
  );
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#0d0e0d" }}>
        {dot(50, 50, "#efebe3")}
        {dot(130, 85, "#ff6a3d")}
        {dot(62, 130, "#efebe3")}
      </div>
    ),
    size,
  );
}
