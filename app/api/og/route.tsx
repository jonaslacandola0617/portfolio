import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site-config";

export const runtime = "edge";

const c = {
  bg: "#0d0e0d",
  fg: "#efebe3",
  dim: "#b3aea4",
  muted: "#7f7a71",
  line: "rgba(239, 235, 227, 0.14)",
  accent: "#ff6a3d",
  ok: "#57d68b",
};

// A few fixed network nodes and links, echoing the homepage hero.
const nodes = [
  [880, 110, 5], [1010, 70, 3], [1110, 170, 7], [960, 250, 3], [1080, 320, 4],
  [1150, 420, 3], [930, 400, 6], [1030, 520, 3], [1140, 560, 4],
] as const;
const links = [[0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 6], [4, 5], [4, 6], [6, 7], [5, 8], [7, 8]] as const;

/** Social preview card (1200×630) used when the site is shared. */
export async function GET() {
  const roles = siteConfig.role.split(/\s*·\s*/).filter(Boolean);
  const host = new URL(siteConfig.siteUrl).host.replace(/^www\./, "");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: c.bg, color: c.fg, fontFamily: "sans-serif" }}>
        {links.map(([a, b], index) => {
          const [x1, y1] = nodes[a];
          const [x2, y2] = nodes[b];
          const length = Math.hypot(x2 - x1, y2 - y1);
          const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
          return (
            <div
              key={index}
              style={{ position: "absolute", left: x1, top: y1, width: length, height: 1, background: index % 4 === 0 ? c.accent : c.line, transform: `rotate(${angle}deg)`, transformOrigin: "0 0" }}
            />
          );
        })}
        {nodes.map(([x, y, r], index) => (
          <div
            key={`n${index}`}
            style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: r >= 6 ? c.accent : c.dim }}
          />
        ))}

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "72px 80px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 24, color: c.fg }}>
            <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, background: c.ok }} />
            Open to IT help desk & technical support roles
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 96, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{siteConfig.name}</div>
            <div style={{ display: "flex", gap: 14, marginTop: 30 }}>
              {roles.map((role, index) => (
                <div
                  key={role}
                  style={{
                    display: "flex", padding: "10px 20px", borderRadius: 999, fontSize: 26,
                    border: `2px solid ${index === 0 ? c.accent : c.line}`, color: index === 0 ? c.accent : c.dim,
                  }}
                >
                  {role}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: c.muted }}>
            <div style={{ display: "flex" }}>Labs · Certificates · Experience</div>
            <div style={{ display: "flex", color: c.fg, fontWeight: 700 }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
