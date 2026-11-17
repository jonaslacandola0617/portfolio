import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { NetworkField } from "@/components/site/network-field";
import { CopyEmail, LocalTime } from "@/components/site/interactive";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

export type HeroStats = {
  labs: number;
  certifications: number;
  projects: number;
  live: number;
};

const WEB_DISCIPLINE = /web|developer|software|front|back|full.?stack/i;

/** IT, networking and security disciplines lead; development follows as a supporting skill. */
function disciplinesOf(role: string) {
  const items = role.split(/\s*[·|,]\s*/).map((item) => item.trim()).filter(Boolean);
  return [...items.filter((item) => !WEB_DISCIPLINE.test(item)), ...items.filter((item) => WEB_DISCIPLINE.test(item))];
}

export function HomeHero({
  settings,
  stats,
  profileImageUrl,
}: {
  settings: SiteSettingsData;
  stats: HeroStats;
  profileImageUrl?: string | null;
}) {
  const [firstName] = settings.name.split(" ");
  const disciplines = disciplinesOf(settings.role);

  const statItems = [
    { value: stats.labs, label: "Documented networking & security labs" },
    { value: stats.certifications, label: "Certifications & training tracks" },
    { value: stats.projects, label: "Technical projects" },
    { value: stats.live, label: stats.live === 1 ? "Tool I built that's live" : "Tools I built that are live" },
  ].filter((item) => item.value > 0);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <NetworkField className="hero-field" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-status">
          <span className="status-pill"><span className="pulse-dot" aria-hidden="true" /> Open to IT, network &amp; security roles</span>
          <LocalTime />
        </div>

        <p className="hero-hello">
          {profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileImageUrl} alt="" className="hero-avatar" width={44} height={44} />
          ) : null}
          <span>Hi, I&apos;m {firstName} — IT support, networking &amp; cybersecurity.</span>
        </p>
        <h1 id="hero-title" className="hero-title">
          I keep networks <em>up</em>, users unblocked, and systems secure
          <span className="hero-title-soft"> — and I document every fix.</span>
        </h1>

        <p className="hero-lede">{settings.tagline}</p>

        {disciplines.length ? (
          <ul className="hero-disciplines" aria-label="Disciplines">
            {disciplines.map((item, index) => <li key={item} className={index === 0 ? "is-primary" : undefined}>{item}</li>)}
          </ul>
        ) : null}

        <div className="hero-actions">
          <Link href="#labs" className="btn btn-solid btn-lg">See my labs <ArrowDown size={16} /></Link>
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
            <Link href="/certifications">View credentials <ArrowUpRight size={15} /></Link>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
