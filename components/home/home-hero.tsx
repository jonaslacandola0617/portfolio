import { ArrowDown } from "lucide-react";
import type { SiteSettingsData } from "@/lib/db/queries/settings";

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    first: parts[0] ?? name,
    rest: parts.slice(1).join(" "),
  };
}

function firstSentence(value: string) {
  const sentence = value.trim().match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
  return sentence || value.trim();
}

export function HomeHero({
  settings,
  learningPhilosophy,
  currentYear,
}: {
  settings: SiteSettingsData;
  learningPhilosophy: string;
  currentYear: number;
}) {
  const name = splitName(settings.name);
  const focusItems = settings.currentlyLearning.slice(0, 3);
  const disciplines = settings.role.split(/\s*[·|]\s*/).map((item) => item.trim()).filter(Boolean).slice(0, 3);

  return (
    <section className="spatial-hero">
      <div className="spatial-coordinate">PH / {currentYear}</div>
      <div className="spatial-orbit" aria-hidden="true"><span /><i /><b /></div>

      <div className="spatial-name-wrap">
        <div className="spatial-line" aria-hidden="true"><span /></div>
        <h1 className="spatial-name">
          <span>{name.first}</span>
          {name.rest ? <span>{name.rest}</span> : null}
        </h1>
      </div>

      <div className="spatial-role">{settings.role.toUpperCase()}</div>
      <div className="spatial-statement">
        <p>{settings.tagline}</p>
        <p className="serif">{firstSentence(learningPhilosophy)}</p>
      </div>

      {focusItems.length ? (
        <div className="spatial-focus">
          <small>NOW / 01</small>
          {focusItems.map((item) => <span key={`${item.label}:${item.href}`}>{item.label}</span>)}
        </div>
      ) : null}

      {disciplines.length ? (
        <div className="spatial-disciplines">
          {disciplines.map((discipline) => <span key={discipline}>{discipline.toUpperCase()}</span>)}
        </div>
      ) : null}
      <a href="#selected-work" className="spatial-scroll" aria-label="Scroll to selected work"><ArrowDown size={17} /></a>
    </section>
  );
}
