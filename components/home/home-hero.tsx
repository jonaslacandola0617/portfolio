import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { NetworkField } from "@/components/site/network-field";
import { CopyEmail, LocalTime } from "@/components/site/interactive";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

export type HeroStats = {
  live: number;
  projects: number;
  labs: number;
  certifications: number;
};

function disciplinesOf(role: string) {
  return role.split(/\s*[·|,]\s*/).map((item) => item.trim()).filter(Boolean);
}

export function HomeHero({ settings, stats }: { settings: SiteSettingsData; stats: HeroStats }) {
  const [primary = "Web developer", ...secondary] = disciplinesOf(settings.role);
  const primaryLabel = primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase();

  const statItems = [
    { value: stats.live, label: stats.live === 1 ? "Product live in production" : "Products live in production" },
    { value: stats.projects, label: "Documented case studies" },
    { value: stats.labs, label: "Networking & security labs" },
    { value: stats.certifications, label: "Certifications & tracks" },
  ].filter((item) => item.value > 0);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <NetworkField className="hero-field" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-status">
          <span className="status-pill"><span className="pulse-dot" aria-hidden="true" /> Available for work</span>
          <LocalTime />
        </div>

        <p className="hero-hello">Hi, I&apos;m {settings.name}.</p>
        <h1 id="hero-title" className="hero-title">
          {primaryLabel} who <em>ships</em> real products
          <span className="hero-title-soft"> — and keeps the systems behind them running.</span>
        </h1>

        <p className="hero-lede">{settings.tagline}</p>

        {secondary.length ? (
          <ul className="hero-disciplines" aria-label="Disciplines">
            <li className="is-primary">{primary}</li>
            {secondary.map((item) => <li key={item}>{item}</li>)}
          </ul>
        ) : null}

        <div className="hero-actions">
          <Link href="#work" className="btn btn-solid btn-lg">See selected work <ArrowDown size={16} /></Link>
          <Link href="/resume" className="btn btn-ghost btn-lg"><FileText size={16} /> Résumé</Link>
          <CopyEmail email={settings.email} label="Copy email" className="btn btn-link" />
        </div>
      </div>

      {statItems.length ? (
        <dl className="hero-stats">
          {statItems.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{String(item.value).padStart(2, "0")}</dd>
            </div>
          ))}
          <div className="hero-stats-link">
            <Link href="/projects">Browse everything <ArrowUpRight size={15} /></Link>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
