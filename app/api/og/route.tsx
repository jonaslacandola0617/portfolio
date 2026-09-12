import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";

const colors = {
  ink: "#0b0c0c",
  surface: "#151615",
  text: "#f4efe6",
  muted: "#aaa49a",
  border: "rgba(244, 239, 230, 0.24)",
  rust: "#d45a3d",
};

function BrandMark() {
  return (
    <div
      style={{
        width: 184,
        height: 184,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.ink,
        border: `5px solid ${colors.text}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          color: colors.text,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 66,
            fontWeight: 800,
            letterSpacing: "-0.08em",
          }}
        >
          JL
        </div>
        <div
          style={{
            display: "flex",
            marginLeft: 2,
            color: colors.rust,
            fontFamily: "Georgia, serif",
            fontSize: 74,
            fontStyle: "italic",
            fontWeight: 500,
          }}
        >
          /
        </div>
      </div>
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
            border: `1px solid ${colors.border}`,
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
                color: colors.rust,
              }}
            >
              Portfolio · Web Development · IT · Networking
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
              background: colors.rust,
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
