import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowUpRight, FileText } from "lucide-react";
import { NetworkField } from "@/components/site/network-field";
import { CopyEmail, LocalTime } from "@/components/site/interactive";
import type { SiteSettingsData } from "@/lib/db/queries/settings";
import type { HomepageContent } from "@/lib/validations/homepage";

const WEB_DISCIPLINE = /web|developer|software|front|back|full.?stack/i;

/** IT, networking and security disciplines lead; development follows. */
function disciplinesOf(role: string) {
  const items = role.split(/\s*[·|,]\s*/).map((item) => item.trim()).filter(Boolean);
  return [...items.filter((item) => !WEB_DISCIPLINE.test(item)), ...items.filter((item) => WEB_DISCIPLINE.test(item))];
}

export function HomeHero({
  settings,
  content,
  certificationCount,
  profileImageUrl,
}: {
  settings: SiteSettingsData;
  content: HomepageContent;
  certificationCount: number;
  profileImageUrl?: string | null;
}) {
  const { hero } = content;
  const availabilityDetail = [hero.availabilityWhere, hero.availabilityShifts].filter(Boolean).join(" · ");
  const [firstName] = settings.name.split(" ");
  const disciplines = disciplinesOf(settings.role);
  const stats = [
    ...content.stats,
    ...(content.showCertificateStat && certificationCount ? [{ value: String(certificationCount), label: certificationCount === 1 ? "Certificate completed" : "Certificates & training paths" }] : []),
  ];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <NetworkField className="hero-field" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-inner">
        <div className="hero-status">
          <span className="status-pill"><span className="pulse-dot" aria-hidden="true" /> Open to {hero.availabilityRoles}</span>
          {availabilityDetail ? <span className="hero-availability">{availabilityDetail}</span> : null}
          <LocalTime />
        </div>

        <p className="hero-hello">
          {profileImageUrl ? (
            <Image src={profileImageUrl} alt="" className="hero-avatar" width={44} height={44} sizes="44px" priority />
          ) : null}
          <span>Hi, I&apos;m {firstName}.</span>
        </p>
        <h1 id="hero-title" className="hero-title">
          <em>{hero.highlight}</em> {hero.headline}
        </h1>

        <p className="hero-lede">{hero.intro}</p>

        {disciplines.length ? (
          <ul className="hero-disciplines" aria-label="Disciplines">
            {disciplines.map((item, index) => <li key={item} className={index === 0 ? "is-primary" : undefined}>{item}</li>)}
          </ul>
        ) : null}

        <div className="hero-actions">
          <Link href={hero.primaryCtaHref} className="btn btn-solid btn-lg">
            {hero.primaryCtaLabel} {hero.primaryCtaHref.startsWith("#") ? <ArrowDown size={16} /> : <ArrowUpRight size={16} />}
          </Link>
          <Link href="/resume" className="btn btn-ghost btn-lg"><FileText size={16} /> Résumé</Link>
          <CopyEmail email={settings.email} label="Copy email" className="btn btn-link" />
        </div>
      </div>

      <div className="hero-stats">
        <dl className="hero-stats-list">
          {stats.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
        <div className="hero-stats-link">
          <Link href="/certifications">View certificates <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </section>
  );
}
