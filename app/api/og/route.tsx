import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";

const colors = {
  ink: "#0a0b0d",
  surface: "#141519",
  text: "#f2f0e8",
  muted: "#a9aba3",
  border: "#e8e6de",
  cobalt: "#5c7cfa",
  vermilion: "#ef5b41",
  yellow: "#f2bd3d",
};

function BrandMark() {
  return (
    <div
      style={{
        position: "relative",
        width: 184,
        height: 184,
        flexShrink: 0,
        background: colors.ink,
        border: `5px solid ${colors.border}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 62,
          top: 39,
          width: 60,
          height: 60,
          borderRadius: 999,
          background: colors.cobalt,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 31,
          top: 112,
          width: 122,
          height: 37,
          background: colors.text,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 31,
          top: 112,
          width: 37,
          height: 37,
          background: colors.vermilion,
        }}
      />
    </div>
  );
}

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "72px 80px",
          background: colors.ink,
          color: colors.text,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            alignItems: "center",
            gap: 64,
            border: `1px solid ${colors.surface}`,
            padding: "56px 64px",
            position: "relative",
          }}
        >
          <BrandMark />

          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                display: "flex",
                marginBottom: 18,
                fontSize: 18,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: colors.cobalt,
              }}
            >
              Portfolio · Cybersecurity · Networking
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: "-0.035em",
              }}
            >
              {siteConfig.name}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontSize: 30,
                color: colors.muted,
              }}
            >
              {siteConfig.role}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 34,
                maxWidth: 670,
                fontSize: 22,
                lineHeight: 1.45,
                color: colors.muted,
              }}
            >
              {siteConfig.tagline}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              right: 34,
              top: 34,
              width: 18,
              height: 18,
              borderRadius: 999,
              background: colors.yellow,
            }}
          />
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
