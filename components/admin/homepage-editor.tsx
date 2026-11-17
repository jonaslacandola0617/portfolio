"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, ExternalLink, Eye, EyeOff, Loader2, Plus, RotateCcw, Save, Trash2,
} from "lucide-react";
import { saveHomepageAction, type HomepageActionState } from "@/app/admin/(dashboard)/homepage/actions";
import { useToast } from "@/components/ui/toast";
import { CAPABILITY_ICONS, type HomepageContent, type HomepageSectionKey } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

type Context = { labs: number; certificates: number; articles: number; aiAssistedProjects: number; featuredProjects: number };
type Errors = Record<string, string>;

const ICON_LABELS: Record<(typeof CAPABILITY_ICONS)[number], string> = {
  support: "Lifebuoy (support)",
  hardware: "Wrench (hardware)",
  network: "Network",
  security: "Shield (security)",
  code: "Code",
  design: "Palette (design)",
};

/* ── Small field primitives ─────────────────────────────────────────────── */

function TextField({
  id, label, hint, value, onChange, error, max, multiline, rows = 3, placeholder,
}: {
  id: string; label: string; hint?: string; value: string; onChange: (value: string) => void;
  error?: string; max?: number; multiline?: boolean; rows?: number; placeholder?: string;
}) {
  const over = max !== undefined && value.length > max;
  return (
    <div className={cn("hp-field", error && "has-error")}>
      <div className="hp-label-row">
        <label htmlFor={id}>{label}</label>
        {max ? <span className={cn("hp-count", over && "is-over")}>{value.length}/{max}</span> : null}
      </div>
      {multiline ? (
        <textarea id={id} value={value} rows={rows} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
      ) : (
        <input id={id} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} />
      )}
      {hint && !error ? <p className="hp-hint">{hint}</p> : null}
      {error ? <p className="hp-error" role="alert">{error}</p> : null}
    </div>
  );
}

/** Comma-separated list. Keeps its own text so typing ", " isn't swallowed. */
function TagsField({ id, label, hint, value, onChange, error }: { id: string; label: string; hint?: string; value: string[]; onChange: (value: string[]) => void; error?: string }) {
  const [text, setText] = useState(value.join(", "));
  return (
    <div className={cn("hp-field", error && "has-error")}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        value={text}
        placeholder="e.g. Troubleshooting, Excel, Outlook"
        onChange={(event) => {
          setText(event.target.value);
          onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean));
        }}
        onBlur={() => setText(value.join(", "))}
      />
      {value.length ? <div className="hp-chip-preview">{value.map((item) => <span key={item}>{item}</span>)}</div> : null}
      <p className="hp-hint">{hint ?? "Separate with commas."}</p>
      {error ? <p className="hp-error" role="alert">{error}</p> : null}
    </div>
  );
}

/** One item per line. */
function LinesField({ id, label, hint, value, onChange, error }: { id: string; label: string; hint?: string; value: string[]; onChange: (value: string[]) => void; error?: string }) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <div className={cn("hp-field", error && "has-error")}>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={Math.min(10, Math.max(3, value.length + 1))}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          onChange(event.target.value.split("\n").map((line) => line.trim()).filter(Boolean));
        }}
      />
      <p className="hp-hint">{hint ?? "One bullet point per line."}</p>
      {error ? <p className="hp-error" role="alert">{error}</p> : null}
    </div>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={cn("hp-switch", checked && "is-on")} onClick={() => onChange(!checked)}>
      <span className="hp-switch-track" aria-hidden="true"><span /></span>
      {label}
    </button>
  );
}

function ListControls({ index, length, onMove, onRemove, removeLabel }: { index: number; length: number; onMove: (to: number) => void; onRemove: () => void; removeLabel: string }) {
  return (
    // preventDefault stops a click inside a <summary> from also opening/closing the card.
    <div className="hp-list-controls">
      <button type="button" onClick={(event) => { event.preventDefault(); onMove(index - 1); }} disabled={index === 0} aria-label="Move up"><ArrowUp /></button>
      <button type="button" onClick={(event) => { event.preventDefault(); onMove(index + 1); }} disabled={index === length - 1} aria-label="Move down"><ArrowDown /></button>
      <button type="button" className="is-danger" onClick={(event) => { event.preventDefault(); onRemove(); }} aria-label={removeLabel}><Trash2 /></button>
    </div>
  );
}

function move<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ── Section heading fields and panel shell (module level so inputs keep focus) ── */

function SectionFields({
  sectionKey, section, errors, onChange, onRestore, note, children,
}: {
  sectionKey: HomepageSectionKey;
  section: HomepageContent["sections"][HomepageSectionKey];
  errors: Errors;
  onChange: (patch: Partial<HomepageContent["sections"][HomepageSectionKey]>) => void;
  onRestore: () => void;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const base = `sections.${sectionKey}`;
  return (
    <>
      <div className="hp-section-toolbar">
        <Switch checked={section.visible} onChange={(visible) => onChange({ visible })} label={section.visible ? "Shown on homepage" : "Hidden from homepage"} />
        <a href={`/#${sectionKey}`} target="_blank" rel="noreferrer" className="hp-link">Preview section <ExternalLink /></a>
        <button type="button" className="hp-link" onClick={onRestore}><RotateCcw /> Restore heading</button>
      </div>
      {note ? <div className="hp-note">{note}</div> : null}
      <div className={cn("hp-grid", !section.visible && "is-muted")}>
        <TextField id={`${base}-kicker`} label="Small label" hint="Appears above the title, next to the number." value={section.kicker} onChange={(kicker) => onChange({ kicker })} error={errors[`${base}.kicker`]} max={40} />
        <TextField id={`${base}-title`} label="Section title" value={section.title} onChange={(title) => onChange({ title })} error={errors[`${base}.title`]} max={140} />
        <div className="is-full">
          <TextField id={`${base}-intro`} label="Intro text (optional)" value={section.intro} onChange={(intro) => onChange({ intro })} error={errors[`${base}.intro`]} max={600} multiline rows={2} />
        </div>
        {children}
      </div>
    </>
  );
}

function Panel({ id, index, title, description, hasError, children }: { id: string; index: string; title: string; description: string; hasError: boolean; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("admin-form-section hp-panel", hasError && "has-error")} aria-labelledby={`${id}-title`}>
      <header>
        <span>{index}</span>
        <div><h2 id={`${id}-title`}>{title}</h2><p>{description}</p></div>
      </header>
      <div className="admin-form-section-body">{children}</div>
    </section>
  );
}

/* ── Editor ─────────────────────────────────────────────────────────────── */

const PANELS: { id: string; label: string; section?: HomepageSectionKey }[] = [
  { id: "hero", label: "Hero" },
  { id: "experience", label: "Experience", section: "experience" },
  { id: "labs", label: "Labs", section: "labs" },
  { id: "certificates", label: "Certificates", section: "certificates" },
  { id: "skills", label: "Skills", section: "skills" },
  { id: "capabilities", label: "What I bring", section: "capabilities" },
  { id: "projects", label: "Projects", section: "projects" },
  { id: "outside", label: "Outside IT", section: "outside" },
  { id: "writing", label: "Writing", section: "writing" },
];

export function HomepageEditor({ initial, defaults, context }: { initial: HomepageContent; defaults: HomepageContent; context: Context }) {
  const [content, setContent] = useState<HomepageContent>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  // Remount list fields after a reset so their local text matches.
  const [resetKey, setResetKey] = useState(0);
  const [state, formAction, pending] = useActionState<HomepageActionState, FormData>(saveHomepageAction, { status: "idle" });
  const formRef = useRef<HTMLFormElement>(null);
  const { success } = useToast();

  const serialized = useMemo(() => JSON.stringify(content), [content]);
  const dirty = serialized !== baseline;
  const errors: Errors = state.status === "invalid" ? state.fieldErrors ?? {} : {};
  const err = (path: string) => errors[path];
  const panelHasError = (prefixes: string[]) => Object.keys(errors).some((path) => prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`)));

  // Mark clean after a successful save of exactly what was submitted.
  const submittedRef = useRef<string>("");
  useEffect(() => {
    if (state.status === "saved") {
      setBaseline(submittedRef.current);
      success(state.message ?? "Homepage saved.", { id: "homepage-save" });
    }
  }, [state.status, state.savedAt, state.message, success]);

  // Warn before leaving with unsaved changes; Ctrl/Cmd+S saves.
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty && !pending) formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [dirty, pending]);

  const set = <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => setContent((current) => ({ ...current, [key]: value }));
  /** Reorder/remove: also remount list fields so their local text follows the item. */
  const setStructural = <K extends keyof HomepageContent>(key: K, value: HomepageContent[K]) => { set(key, value); setResetKey((k) => k + 1); };
  const setHero = (patch: Partial<HomepageContent["hero"]>) => set("hero", { ...content.hero, ...patch });
  const setSection = (key: HomepageSectionKey, patch: Partial<HomepageContent["sections"][HomepageSectionKey]>) =>
    set("sections", { ...content.sections, [key]: { ...content.sections[key], ...patch } });
  const restore = (label: string, apply: () => void) => {
    if (window.confirm(`Restore the default text for ${label}? Your unsaved edits in this part will be replaced.`)) {
      apply();
      setResetKey((value) => value + 1);
    }
  };

  const sectionProps = (sectionKey: HomepageSectionKey) => ({
    sectionKey,
    section: content.sections[sectionKey],
    errors,
    onChange: (patch: Partial<HomepageContent["sections"][HomepageSectionKey]>) => setSection(sectionKey, patch),
    onRestore: () => restore(`the ${content.sections[sectionKey].kicker} heading`, () => setSection(sectionKey, defaults.sections[sectionKey])),
  });

  const statusText = pending
    ? "Saving…"
    : state.status === "invalid" || state.status === "error"
      ? state.message
      : dirty
        ? "Unsaved changes"
        : state.status === "saved" ? "All changes saved" : "No changes yet";

  return (
    <form
      ref={formRef}
      action={(formData) => { submittedRef.current = serialized; formAction(formData); }}
      className="hp-editor"
      key={resetKey}
    >
      <input type="hidden" name="payload" value={serialized} readOnly />

      <div className="hp-topbar">
        <div className="hp-topbar-title">
          <h1>Homepage</h1>
          <p>Everything on your public homepage, in the same order visitors see it.</p>
        </div>
        <div className="hp-topbar-actions">
          <span className={cn("hp-status", dirty && "is-dirty", (state.status === "invalid" || state.status === "error") && "is-error")} aria-live="polite">
            {state.status === "saved" && !dirty && !pending ? <Check aria-hidden="true" /> : null}{statusText}
          </span>
          <a href="/" target="_blank" rel="noreferrer" className="hp-btn hp-btn-ghost"><ExternalLink aria-hidden="true" /> View homepage</a>
          <button type="submit" className="hp-btn hp-btn-solid" disabled={!dirty || pending}>
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Save
            <kbd>⌘S</kbd>
          </button>
        </div>
        <nav className="hp-jump" aria-label="Homepage sections">
          {PANELS.map((panel) => {
            const hidden = panel.section ? !content.sections[panel.section].visible : false;
            const hasError = panelHasError(panel.section ? [`sections.${panel.section}`, panel.id] : ["hero", "stats"]);
            return (
              <a key={panel.id} href={`#${panel.id}`} className={cn(hidden && "is-hidden", hasError && "has-error")}>
                {hidden ? <EyeOff aria-label="hidden" /> : <Eye aria-hidden="true" />}{panel.label}
              </a>
            );
          })}
        </nav>
      </div>

      {/* Hero */}
      <Panel id="hero" index="00" title="Hero" description="The first screen: availability, headline, intro, main button and numbers." hasError={panelHasError(["hero", "stats"])}>
        <div className="hp-section-toolbar">
          <a href="/" target="_blank" rel="noreferrer" className="hp-link">Preview <ExternalLink /></a>
          <button type="button" className="hp-link" onClick={() => restore("the hero", () => setContent((c) => ({ ...c, hero: defaults.hero, stats: defaults.stats, showCertificateStat: defaults.showCertificateStat })))}><RotateCcw /> Restore defaults</button>
        </div>
        <div className="hp-preview-hero" aria-hidden="true">
          <span className="hp-preview-pill">● Open to {content.hero.availabilityRoles || "…"}</span>
          <p><em>{content.hero.highlight || "…"}</em> {content.hero.headline}</p>
        </div>
        <h3 className="hp-subhead">Availability</h3>
        <div className="hp-grid">
          <TextField id="hero-roles" label="Open to…" hint="Completes “Open to …” in the green badge." value={content.hero.availabilityRoles} onChange={(availabilityRoles) => setHero({ availabilityRoles })} error={err("hero.availabilityRoles")} max={120} />
          <TextField id="hero-where" label="Where" placeholder="Remote or on-site in …" value={content.hero.availabilityWhere} onChange={(availabilityWhere) => setHero({ availabilityWhere })} error={err("hero.availabilityWhere")} max={120} />
          <TextField id="hero-shifts" label="Shifts (optional)" placeholder="Night shift OK" value={content.hero.availabilityShifts} onChange={(availabilityShifts) => setHero({ availabilityShifts })} error={err("hero.availabilityShifts")} max={60} />
        </div>
        <h3 className="hp-subhead">Headline</h3>
        <div className="hp-grid">
          <TextField id="hero-highlight" label="Highlighted words" hint="Shown in the accent colour at the start." value={content.hero.highlight} onChange={(highlight) => setHero({ highlight })} error={err("hero.highlight")} max={60} />
          <TextField id="hero-headline" label="Rest of the headline" value={content.hero.headline} onChange={(headline) => setHero({ headline })} error={err("hero.headline")} max={160} />
          <div className="is-full">
            <TextField id="hero-intro" label="Intro paragraph" hint="2–3 sentences. Say what you've done, then what you want." value={content.hero.intro} onChange={(intro) => setHero({ intro })} error={err("hero.intro")} max={700} multiline rows={4} />
          </div>
          <TextField id="hero-cta-label" label="Main button label" value={content.hero.primaryCtaLabel} onChange={(primaryCtaLabel) => setHero({ primaryCtaLabel })} error={err("hero.primaryCtaLabel")} max={40} />
          <TextField id="hero-cta-href" label="Main button link" hint="A section like #experience, a page like /labs, or a full https:// link." value={content.hero.primaryCtaHref} onChange={(primaryCtaHref) => setHero({ primaryCtaHref })} error={err("hero.primaryCtaHref")} />
        </div>
        <h3 className="hp-subhead">Numbers row <small>({content.stats.length}/4)</small></h3>
        <div className="hp-list">
          {content.stats.map((stat, index) => (
            <div className="hp-row hp-row-inline" key={`stat-${index}`}>
              <span className="hp-row-index">{String(index + 1).padStart(2, "0")}</span>
              <TextField id={`stat-${index}-value`} label="Value" placeholder="40/day" value={stat.value} onChange={(value) => set("stats", content.stats.map((s, i) => i === index ? { ...s, value } : s))} error={err(`stats.${index}.value`)} max={16} />
              <TextField id={`stat-${index}-label`} label="Label" placeholder="Cases handled at peak" value={stat.label} onChange={(label) => set("stats", content.stats.map((s, i) => i === index ? { ...s, label } : s))} error={err(`stats.${index}.label`)} max={60} />
              <ListControls index={index} length={content.stats.length} onMove={(to) => setStructural("stats", move(content.stats, index, to))} onRemove={() => setStructural("stats", content.stats.filter((_, i) => i !== index))} removeLabel={`Remove number ${index + 1}`} />
            </div>
          ))}
        </div>
        <div className="hp-row-actions">
          <button type="button" className="admin-add-row" disabled={content.stats.length >= 4} onClick={() => set("stats", [...content.stats, { value: "", label: "" }])}><Plus aria-hidden="true" /> Add number</button>
          <Switch checked={content.showCertificateStat} onChange={(showCertificateStat) => set("showCertificateStat", showCertificateStat)} label={`Also show certificate count (${context.certificates})`} />
        </div>
      </Panel>

      {/* Experience */}
      <Panel id="experience" index="01" title="Experience" description="Jobs and hands-on work, newest first. Skills listed here also feed the Skills picker." hasError={panelHasError(["sections.experience", "experience"])}>
        <SectionFields {...sectionProps("experience")} />
        <h3 className="hp-subhead">Entries <small>({content.experience.length}/8)</small></h3>
        <div className="hp-list">
          {content.experience.map((entry, index) => {
            const base = `experience.${index}`;
            const update = (patch: Partial<typeof entry>) => set("experience", content.experience.map((e, i) => i === index ? { ...e, ...patch } : e));
            return (
              <details className="hp-card" key={`exp-${index}-${resetKey}`} open={index === 0 || panelHasError([base])}>
                <summary>
                  <span className="hp-row-index">{String(index + 1).padStart(2, "0")}</span>
                  <span className="hp-card-title"><strong>{entry.title || "Untitled entry"}</strong><small>{[entry.org, entry.period].filter(Boolean).join(" · ")}</small></span>
                  <ListControls index={index} length={content.experience.length} onMove={(to) => setStructural("experience", move(content.experience, index, to))} onRemove={() => { if (window.confirm(`Remove “${entry.title || "this entry"}”?`)) setStructural("experience", content.experience.filter((_, i) => i !== index)); }} removeLabel={`Remove ${entry.title}`} />
                </summary>
                <div className="hp-grid">
                  <TextField id={`${base}-title`} label="Job title or heading" value={entry.title} onChange={(title) => update({ title })} error={err(`${base}.title`)} max={120} />
                  <TextField id={`${base}-org`} label="Company or context" value={entry.org} onChange={(org) => update({ org })} error={err(`${base}.org`)} max={120} />
                  <TextField id={`${base}-place`} label="Location (optional)" value={entry.place} onChange={(place) => update({ place })} error={err(`${base}.place`)} max={120} />
                  <TextField id={`${base}-period`} label="Period" placeholder="Aug 2025 – Mar 2026" value={entry.period} onChange={(period) => update({ period })} error={err(`${base}.period`)} max={60} />
                  <div className="is-full"><TextField id={`${base}-summary`} label="Short summary (optional)" value={entry.summary} onChange={(summary) => update({ summary })} error={err(`${base}.summary`)} max={600} multiline rows={2} /></div>
                  <div className="is-full"><LinesField id={`${base}-points`} label="What you did" hint="One bullet per line. Start with a verb and include numbers where you can." value={entry.points} onChange={(points) => update({ points })} error={err(`${base}.points`)} /></div>
                  <div className="is-full"><TagsField id={`${base}-skills`} label="Skills used" value={entry.skills} onChange={(skills) => update({ skills })} error={err(`${base}.skills`)} /></div>
                </div>
              </details>
            );
          })}
        </div>
        <button type="button" className="admin-add-row" disabled={content.experience.length >= 8} onClick={() => setStructural("experience", [{ title: "", org: "", place: "", period: "", summary: "", points: [], skills: [] }, ...content.experience])}><Plus aria-hidden="true" /> Add entry at the top</button>
      </Panel>

      {/* Labs */}
      <Panel id="labs" index="02" title="Labs" description="Shows your four newest published labs." hasError={panelHasError(["sections.labs"])}>
        <SectionFields {...sectionProps("labs")} note={<>{context.labs} published lab{context.labs === 1 ? "" : "s"}. <Link href="/admin/labs">Manage labs →</Link></>} />
      </Panel>

      {/* Certificates */}
      <Panel id="certificates" index="03" title="Certificates" description="Shows up to six published certificates, IT ones first." hasError={panelHasError(["sections.certificates"])}>
        <SectionFields {...sectionProps("certificates")} note={<>{context.certificates} published certificate{context.certificates === 1 ? "" : "s"}. Add a credential URL to show a Verify button. <Link href="/admin/certificates">Manage certificates →</Link></>} />
      </Panel>

      {/* Skills */}
      <Panel id="skills" index="04" title="Skills picker" description="Built automatically from experience skills, lab tags, certificate skills and project technologies." hasError={panelHasError(["sections.skills"])}>
        <SectionFields {...sectionProps("skills")} />
      </Panel>

      {/* Capabilities */}
      <Panel id="capabilities" index="05" title="What I bring" description="Short cards about what you can do for a team. Four reads best." hasError={panelHasError(["sections.capabilities", "capabilities"])}>
        <SectionFields {...sectionProps("capabilities")} />
        <h3 className="hp-subhead">Cards <small>({content.capabilities.length}/6)</small></h3>
        <div className="hp-list hp-card-grid">
          {content.capabilities.map((card, index) => {
            const base = `capabilities.${index}`;
            const update = (patch: Partial<typeof card>) => set("capabilities", content.capabilities.map((c, i) => i === index ? { ...c, ...patch } : c));
            return (
              <div className="hp-card is-static" key={`cap-${index}`}>
                <div className="hp-card-head">
                  <span className="hp-row-index">{String(index + 1).padStart(2, "0")}</span>
                  <ListControls index={index} length={content.capabilities.length} onMove={(to) => setStructural("capabilities", move(content.capabilities, index, to))} onRemove={() => setStructural("capabilities", content.capabilities.filter((_, i) => i !== index))} removeLabel={`Remove ${card.title}`} />
                </div>
                <div className="hp-field">
                  <label htmlFor={`${base}-icon`}>Icon</label>
                  <select id={`${base}-icon`} value={card.icon} onChange={(event) => update({ icon: event.target.value as typeof card.icon })}>
                    {CAPABILITY_ICONS.map((icon) => <option key={icon} value={icon}>{ICON_LABELS[icon]}</option>)}
                  </select>
                </div>
                <TextField id={`${base}-title`} label="Title" value={card.title} onChange={(title) => update({ title })} error={err(`${base}.title`)} max={60} />
                <TextField id={`${base}-body`} label="Text" value={card.body} onChange={(body) => update({ body })} error={err(`${base}.body`)} max={400} multiline rows={4} />
                <TextField id={`${base}-link`} label="Link label" value={card.linkLabel} onChange={(linkLabel) => update({ linkLabel })} error={err(`${base}.linkLabel`)} max={40} />
                <TextField id={`${base}-href`} label="Link" placeholder="/labs or #experience" value={card.href} onChange={(href) => update({ href })} error={err(`${base}.href`)} />
              </div>
            );
          })}
        </div>
        <button type="button" className="admin-add-row" disabled={content.capabilities.length >= 6} onClick={() => set("capabilities", [...content.capabilities, { icon: "support", title: "", body: "", linkLabel: "Learn more", href: "/about" }])}><Plus aria-hidden="true" /> Add card</button>
      </Panel>

      {/* Projects */}
      <Panel id="projects" index="06" title="Projects" description="Your two starred projects, plus the AI-assisted wording used site-wide." hasError={panelHasError(["sections.projects", "aiNote"])}>
        <SectionFields {...sectionProps("projects")}
          note={<>{context.featuredProjects}/2 projects starred for the homepage · {context.aiAssistedProjects} marked AI-assisted. <Link href="/admin/projects">Choose projects →</Link></>}
        />
        <h3 className="hp-subhead">AI-assisted wording</h3>
        <p className="hp-hint">Shown on every project you tick “AI-assisted build” for. If the section intro above is empty, the explanation is used there too.</p>
        <div className="hp-grid">
          <TextField id="ai-short" label="Badge text" value={content.aiNote.short} onChange={(short) => set("aiNote", { ...content.aiNote, short })} error={err("aiNote.short")} max={40} />
          <div className="is-full">
            <TextField id="ai-long" label="Explanation" value={content.aiNote.long} onChange={(long) => set("aiNote", { ...content.aiNote, long })} error={err("aiNote.long")} max={600} multiline rows={4} />
          </div>
        </div>
      </Panel>

      {/* Outside IT */}
      <Panel id="outside" index="07" title="Outside IT" description="Creative work and interests: personality without distracting from IT." hasError={panelHasError(["sections.outside", "outside"])}>
        <SectionFields {...sectionProps("outside")}>
          <TextField id="outside-link" label="Link label (optional)" value={content.outside.linkLabel} onChange={(linkLabel) => set("outside", { ...content.outside, linkLabel })} error={err("outside.linkLabel")} max={40} />
          <TextField id="outside-href" label="Link (optional)" placeholder="/video" value={content.outside.href} onChange={(href) => set("outside", { ...content.outside, href })} error={err("outside.href")} />
        </SectionFields>
        <h3 className="hp-subhead">Areas <small>({content.outside.areas.length}/6)</small></h3>
        <div className="hp-list hp-card-grid">
          {content.outside.areas.map((area, index) => {
            const base = `outside.areas.${index}`;
            const update = (patch: Partial<typeof area>) => set("outside", { ...content.outside, areas: content.outside.areas.map((a, i) => i === index ? { ...a, ...patch } : a) });
            return (
              <div className="hp-card is-static" key={`area-${index}-${resetKey}`}>
                <div className="hp-card-head">
                  <span className="hp-row-index">{String(index + 1).padStart(2, "0")}</span>
                  <ListControls index={index} length={content.outside.areas.length} onMove={(to) => setStructural("outside", { ...content.outside, areas: move(content.outside.areas, index, to) })} onRemove={() => setStructural("outside", { ...content.outside, areas: content.outside.areas.filter((_, i) => i !== index) })} removeLabel={`Remove ${area.name}`} />
                </div>
                <TextField id={`${base}-name`} label="Name" value={area.name} onChange={(name) => update({ name })} error={err(`${base}.name`)} max={60} />
                <TextField id={`${base}-body`} label="Description" value={area.body} onChange={(body) => update({ body })} error={err(`${base}.body`)} max={300} multiline rows={3} />
                <TagsField id={`${base}-tools`} label="Tools" value={area.tools} onChange={(tools) => update({ tools })} error={err(`${base}.tools`)} />
              </div>
            );
          })}
        </div>
        <button type="button" className="admin-add-row" disabled={content.outside.areas.length >= 6} onClick={() => set("outside", { ...content.outside, areas: [...content.outside.areas, { name: "", body: "", tools: [] }] })}><Plus aria-hidden="true" /> Add area</button>
      </Panel>

      {/* Writing */}
      <Panel id="writing" index="08" title="Writing" description="Your four newest published journal entries." hasError={panelHasError(["sections.writing"])}>
        <SectionFields {...sectionProps("writing")} note={<>{context.articles} published entr{context.articles === 1 ? "y" : "ies"}. <Link href="/admin/journal">Manage writing →</Link></>} />
      </Panel>

      <div className="hp-footer">
        <span>{dirty ? "You have unsaved changes." : "Everything is saved."}</span>
        <button type="submit" className="hp-btn hp-btn-solid" disabled={!dirty || pending}>{pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />} Save homepage</button>
      </div>
    </form>
  );
}
