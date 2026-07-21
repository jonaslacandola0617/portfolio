# Cyber Portfolio

A documentation-style cybersecurity & networking portfolio — built with Next.js 14 (App Router),
TypeScript, Tailwind CSS, and MDX. Every project, lab, and journal entry is a markdown file; the
site turns them into a searchable, tagged, cross-linked site with no hardcoded content.

## Quick start

```bash
npm install
npm run dev
```

Open http://localhost:3000. The first build will download Inter, Space Grotesk, and JetBrains
Mono from Google Fonts — that requires normal internet access (this only happens once per build;
the fonts are then self-hosted, no runtime requests to Google).

```bash
npm run build   # production build, fully static where possible
npm run start   # serve the production build locally
```

## Make it yours — start here

**`lib/site-config.ts`** is the one file to edit first. It holds your name, role, tagline, email,
social links, resume path, and the "Currently Learning" list on the home page.

Then:

| What | Where |
| --- | --- |
| Certifications & progress | `lib/data/certifications.ts` |
| Timeline / learning journey | `lib/data/timeline.ts` |
| Skills by category | `lib/data/skills.ts` |
| GitHub activity widget | `lib/data/github.ts` (static sample — see below to make it live) |
| Resume PDF | `public/resume.pdf` (a sample is included — see `scripts/generate_resume.py`) |
| Color palette / fonts | `tailwind.config.ts` + CSS variables in `app/globals.css` |

## Adding content — no code required

Every project, lab, and journal entry is a single `.mdx` file. Drop a new file into the right
folder and it appears on the site automatically — no imports, no routing changes, no rebuilding
data arrays.

```
content/
  projects/   ← content/projects/my-new-project.mdx
  labs/       ← content/labs/my-new-lab.mdx
  articles/   ← content/articles/my-new-post.mdx   (Learning Journal)
```

Copy the frontmatter shape from any existing file in that folder — the required fields are
defined in `types/index.ts` (`ProjectFrontmatter`, `LabFrontmatter`, `ArticleFrontmatter`).

Inside the MDX body you can use:

- Standard Markdown — headings, lists, tables, images, links
- Fenced code blocks with syntax highlighting: ` ```text `, ` ```python `, etc.
- ` ```mermaid ` fenced blocks — rendered as live diagrams (flowcharts, sequence diagrams, topology sketches)
- `<Callout type="info | tip | warning | success | danger" title="...">...</Callout>` for highlighted notes
- `<CommandBlock title="..." commands={["cmd one", "cmd two"]} />` for terminal-style command lists with copy-to-clipboard

Tags in frontmatter (`tags: ["VLAN", "CCNA"]`) automatically become clickable and feed the
`/tags/[tag]` archive pages and the global search index (`⌘K` / `Ctrl+K`).

## Project structure

```
app/                  Routes (App Router) — one folder per page, [slug] folders for MDX detail pages
components/
  ui/                 Small primitives (button, card, badge, dialog...) — hand-rolled shadcn-style
  layout/              Sidebar, mobile nav, theme provider/toggle
  shared/             Reusable content components (ProjectCard, Timeline, CommandBlock, etc.)
content/              MDX content collections — projects, labs, articles
lib/
  content.ts          Reads & sorts the MDX collections, builds the search index
  site-config.ts       Your personal info — edit this first
  data/                Certifications, timeline, skills, GitHub activity
  utils.ts             cn(), date formatting, slugify
types/                 Shared TypeScript types for all content
hooks/                 use-search (⌘K command palette state)
public/                Static files — resume.pdf, images
scripts/               generate_resume.py — optional helper to regenerate the sample resume PDF
```

## Wiring up live data (optional)

**GitHub activity widget** — currently static sample data in `lib/data/github.ts`. To make it
live, fetch `https://api.github.com/users/<you>/repos?sort=updated` in an async Server Component
and pass the results into `<GitHubCard />` the same way `app/page.tsx` does now.

**Contact form** — `components/shared/contact-form.tsx` currently opens the visitor's email
client with a pre-filled `mailto:` link (works with zero backend, zero dependencies). If you'd
rather receive submissions directly, swap the `handleSubmit` function for a POST to a service like
Formspree, Resend, or a Next.js Route Handler you add under `app/api/contact/route.ts`.

**Resume** — replace `public/resume.pdf` with your real resume (same filename), or update
`resumeUrl` in `lib/site-config.ts` to point elsewhere. `scripts/generate_resume.py` (needs
`pip install reportlab`) shows how the included sample was generated if you'd like to keep
generating it from structured data instead of a PDF export from Word/Docs.

## Design notes

- Color system lives entirely in CSS variables (`app/globals.css`) so the whole site re-themes
  from one place — dark slate is the default, a lighter slate theme is available via the sidebar
  theme toggle.
- Headings use Space Grotesk, body text uses Inter, and anything technical — commands, tags,
  metadata, code — uses JetBrains Mono. Change the font imports in `app/layout.tsx`.
- UI primitives in `components/ui` are written by hand in the shadcn/ui style (Radix + Tailwind +
  `class-variance-authority`) rather than pulled from the shadcn CLI, so there's no external
  registry dependency — copy/extend them freely.

## Deploying

This is a standard Next.js app — it deploys as-is to Vercel, Netlify, or any Node host. All
project/lab/journal pages are statically generated at build time (`generateStaticParams`), so
adding new MDX content just means a new build/deploy, not new code.
