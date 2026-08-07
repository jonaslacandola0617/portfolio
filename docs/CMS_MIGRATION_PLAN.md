# CMS Migration Plan — Portfolio → Documentation Platform

Status: **proposal, not yet implemented**. Nothing in this document has been applied to the app
code. `prisma/schema.prisma` (sibling to this file) is the one exception — it's included as a
concrete artifact to review, not yet migrated against a database.

## 0. The finding that shapes this whole plan

Every public page and component reads content through **`lib/content.ts`** exclusively —
`getAllProjects`, `getProjectBySlug`, `getAllLabs`, etc. Nothing else in `app/` or `components/`
imports `fs`, `gray-matter`, or touches `content/*.mdx` directly. `lib/data/*.ts`
(certifications, timeline, skills, github) plays the same role for the non-MDX content.

That means this migration is mostly a **swap behind an existing seam**, not a rewrite:

```
BEFORE   app/*/page.tsx → lib/content.ts (reads fs + gray-matter) → content/*.mdx
AFTER    app/*/page.tsx → lib/content.ts (reads Prisma)           → PostgreSQL
```

As long as the functions in `lib/content.ts` keep their names and return shapes, **every page
component below them is unaffected**. The one real shape change is `content`: it was a markdown
string rendered by `next-mdx-remote`; it becomes TipTap JSON rendered by a new
`<ContentRenderer />`. That's a contained, well-scoped change (3 call sites), not a redesign.

This is why the roadmap below can satisfy "public site must keep working" and "don't change
routes unless necessary" literally, not just in spirit.

## 1. File impact analysis

### Untouched — zero changes

Pure presentational components that consume typed props, never content-source-specific:

```
components/ui/*                     (button, card, badge, dialog, tabs, input, label,
                                      scroll-area, separator, textarea, tooltip, accordion)
components/layout/*                 (sidebar, mobile-nav, theme-provider, theme-toggle)
components/shared/project-card.tsx
components/shared/lab-card.tsx
components/shared/certificate-card.tsx
components/shared/timeline.tsx
components/shared/skill-badge.tsx
components/shared/tag.tsx
components/shared/status-badges.tsx
components/shared/page-header.tsx
components/shared/download-card.tsx
components/shared/related-content.tsx
components/shared/github-card.tsx
components/shared/learning-progress.tsx
components/shared/network-topology.tsx
components/shared/reading-progress.tsx
components/shared/table-of-contents.tsx
components/shared/search-dialog.tsx
components/shared/contact-form.tsx
components/shared/icon-map.tsx
app/about/page.tsx, app/resume/page.tsx, app/contact/page.tsx, app/not-found.tsx
```

**Reused, not rewritten** — these three currently render MDX custom components. Their visual
implementation becomes the *read view* for the equivalent TipTap custom nodes (same component,
new caller):

```
components/shared/callout.tsx         → render target for the TipTap Callout node
components/shared/command-block.tsx   → render target for the TipTap CommandBlock node
components/shared/mermaid-diagram.tsx → render target for the TipTap Topology/Mermaid node
```

### Modified — why each one changes

| File | Change | Why |
| --- | --- | --- |
| `lib/content.ts` | Reimplemented: `fs`+`gray-matter` → Prisma queries | Same exported function signatures, new implementation. This is the seam. |
| `lib/data/certifications.ts`, `timeline.ts`, `skills.ts` | Replaced by Prisma-backed query functions (folded into `lib/content.ts` or a new `lib/db/queries/`) | These were already static-array stand-ins for what should be DB tables |
| `lib/site-config.ts` | Becomes seed data, not runtime source | Runtime values now come from `SiteSettings` (the CMS "Settings" screen); this file seeds that row once |
| `types/index.ts` | `content: string` → `content: JSONContent` (TipTap) on Project/Lab/Article/Certificate frontmatter types | Reflects the new storage format |
| `components/shared/mdx-content.tsx` | Replaced by new `components/shared/content-renderer.tsx` | Renders TipTap JSON instead of an MDX string — see §4 |
| `app/projects/[slug]/page.tsx`, `app/labs/[slug]/page.tsx`, `app/journal/[slug]/page.tsx` | Swap `<MdxContent source={content} />` → `<ContentRenderer content={content} />` | Only the render call changes; layout, sidebar, TOC, related content all stay identical |
| `app/projects/page.tsx`, `labs/page.tsx`, `journal/page.tsx`, `certifications/page.tsx`, `timeline/page.tsx`, `skills/page.tsx` | Import source changes from `lib/data/*` to the new query functions | Same props flow into the same list components |
| `app/tags/[tag]/page.tsx` | Query changes from "fetch everything, filter in JS by slugified tag" to "query by Tag relation" | Simplification, not a rewrite — same page shape |
| `app/page.tsx` (home) | No structural change | Already calls `getAllProjects`/`getAllLabs`/`getAllArticles`, which are async-compatible already |
| `app/robots.ts`, `app/sitemap.ts` | Become `async` | They already call `lib/content.ts` functions; those functions now await Prisma |
| `app/layout.tsx` | Becomes `async`, `getSearchIndex()` becomes an awaited call | Search index now needs a DB read instead of a sync fs read |
| `package.json` | New deps added; `next-mdx-remote`, `gray-matter`, `rehype-*`, `remark-gfm`, `reading-time` become removable (not removed until Phase 3 confirms parity) | New content pipeline needs Prisma/TipTap/Auth.js/Blob; old MDX pipeline is retired gradually |
| `next.config.mjs` | Add Vercel Blob's public hostname to `images.remotePatterns` | Thumbnails/inline images now come from Blob, not `public/images` |

### New — purely additive, zero risk to existing routes

```
prisma/schema.prisma          (included in this delivery — see sibling file)
prisma/seed.ts                (one-time MDX → DB migration script, see §5)
lib/db.ts                     Prisma client singleton (standard Next.js hot-reload-safe pattern)
lib/auth.ts / auth.ts         Auth.js config
middleware.ts                 Protects /admin/*, redirects unauthenticated visitors
app/admin/**                  Entire dashboard route group — disjoint from public routes
app/admin/login/page.tsx
app/api/admin/media/upload/route.ts   (or a Server Action — see §6)
components/editor/**          TipTap shell, toolbar, slash-command menu, custom nodes, templates
components/shared/content-renderer.tsx   Read-only TipTap JSON renderer for the public site
types/editor.ts               TipTap JSON + template types
lib/db/queries/*.ts           Per-content-type Prisma query modules (projects.ts, labs.ts, ...)
```

## 2. Why nothing in `app/` needs new routes

The brief asks not to change existing routes "unless absolutely necessary." Nothing here requires
it — `/admin` is a new, disjoint route tree; every public route keeps its existing path and
`generateStaticParams` pattern, just backed by a different query underneath.

## 3. Schema design decisions worth flagging

(Full schema in `prisma/schema.prisma`.)

- **No `User`/`Account`/`Session` tables.** The brief specifies a single Admin role and nothing
  else. Modeling a full multi-user auth schema for one person is unnecessary weight. Recommended
  approach: Auth.js v5 with a **Credentials provider** checked against `ADMIN_EMAIL` /
  `ADMIN_PASSWORD_HASH` env vars, JWT session strategy, no database adapter at all. If you'd
  rather not manage a password, GitHub OAuth restricted to one allow-listed email is a clean
  alternative — same "no DB tables" property, since Auth.js can run adapter-less with JWT
  sessions either way. **This is the first decision I'd like you to confirm before Phase 0.**
- **`publishStatus` vs `progressStatus` are deliberately separate fields**, not one status enum.
  `publishStatus` (Draft/Published/Archived/Scheduled) is CMS workflow — is this visible on the
  site. `progressStatus` (Planned/In Progress/Completed) is the existing domain concept already
  rendered by `StatusBadge` today — how far along the actual lab/project/cert is in real life. In
  the current seed content, the ACL lab is publicly visible *and* marked in-progress
  simultaneously — conflating the two fields would make that state unrepresentable.
- **`Category` is one-per-item, `Tag` is many-per-item** — matches current frontmatter cardinality
  exactly (`category: string` singular, `tags: string[]` plural). No behavior change, just
  normalized storage.
- **`Certificate ↔ Project` is many-to-many** per your spec, a superset of the current
  single `relatedCertification?: string` field — the sidebar block on the project page changes
  from `.find()` to `.map()` over the relation, everything else is identical.
- **`Download` has a nullable `projectId`**, not a polymorphic relation (Prisma doesn't model true
  polymorphism cleanly). It's scoped to Project today because that's the only content type with
  downloads currently; add `labId`/`articleId` nullable columns later if that changes.
- **`Media` is one model, not separate `Image`/`Media` models** — an uploaded file's `type` enum
  (`IMAGE`/`PCAP`/`PACKET_TRACER`/...) is the only real difference between them. One table is
  easier to query for the Media Library grid than two.

## 4. Editor architecture — consolidating the block list

Your spec lists 18 block types (Cisco CLI, Linux Terminal, PowerShell, JSON, YAML, Python, Packet
Capture, Warning, Success, Info, Troubleshooting, Lessons Learned, Configuration, Verification,
Objective, Topology, plus standard rich-text). Implementing 18 distinct TipTap node types would
work, but most of that list is the same *shape* of block with a different label or language:

| What you asked for | How it's implemented | Why |
| --- | --- | --- |
| Cisco CLI, Linux Terminal, PowerShell, JSON, YAML, Python | **One** `CodeBlock` node (extends `CodeBlockLowlight`) with a `language` attribute + slash-command per language | Same node type, same rendering component, parameterized — matches `components/shared/code-block.tsx`, which already takes a `language` prop |
| Warning, Success, Info | **One** `Callout` node with a `variant` attribute | Directly reuses `components/shared/callout.tsx`, unchanged, which already supports `type="warning" \| "success" \| "info" \| ...` |
| Packet Capture | Its own `PacketCapture` node (filter, frame count, description as structured fields, not just text) | Genuinely structured data, not just styled text — deserves a real node |
| Topology | `Mermaid` node (edit raw diagram text, render via `components/shared/mermaid-diagram.tsx`, unchanged) | Reuses existing rendering; editing a diagram as text is how Mermaid already works everywhere else in the project |
| Troubleshooting, Lessons Learned, Configuration, Verification, Objective | **Not custom nodes at all** — pre-filled `H2` headings in the **templates** (§7), exactly like the existing MDX content already structures these sections | These are document structure, not block types. Making each one a bespoke node would mean 5 near-identical components for what is really "a heading with a label" |

Net: **5 genuinely custom TipTap nodes** (`CodeBlock`, `Callout`, `CommandBlock`, `PacketCapture`,
`Mermaid`) plus official TipTap extensions for tables, task lists, images, and the rest of
standard rich text — instead of 18 bespoke components to build and maintain. Every slash-command
your spec asked for still exists; several of them just resolve to the same node with a different
default attribute, the same way "Heading 1" and "Heading 2" are one `Heading` node in TipTap
today, not two.

**One more structural decision:** the extension list (`lib/editor/extensions.ts`) is imported by
*both* the live admin editor and the read-only `<ContentRenderer />`. One editor instance with
`editable: false` powers the public-site render. This guarantees the public page can never drift
from what the editor actually produced — no separate JSON→React serializer to keep in sync.

## 5. Migrating existing content — MDX → TipTap JSON

The 12 existing `.mdx` files already use `<Callout>` and `<CommandBlock>` as MDX JSX components,
which is what makes this tractable instead of a lossy text scrape. `prisma/seed.ts` (Phase 2)
will:

1. Parse each `.mdx` file's AST with `remark-parse` + `remark-mdx` (already project dependencies).
2. Walk the AST: standard nodes (headings, paragraphs, lists, tables, code fences) go through
   `remark-rehype` → HTML → `generateJSON(html, extensions)` from `@tiptap/html`, using the *same*
   extension list from §4 — so migrated content is guaranteed to open correctly in the live editor.
3. `mdxJsxFlowElement` nodes (`<Callout type="...">`, `<CommandBlock commands={[...]} />`) are
   special-cased directly into their TipTap node-JSON equivalents (their props map almost 1:1 to
   node attributes already).
4. The resulting JSON is written to the relevant table alongside the scalar frontmatter fields
   (title, slug, tags → `connectOrCreate`, etc).

This runs once per content type, as a reviewable script — not a runtime dependency. Rough shape:

```ts
// prisma/seed.ts (sketch — not the full script)
for (const file of readdirSync("content/projects")) {
  const { data, content } = matter(readFileSync(`content/projects/${file}`, "utf8"));
  const json = await mdxToTiptapJSON(content); // the AST walk described above
  await prisma.project.create({
    data: {
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      content: json,
      difficulty: data.difficulty.toUpperCase(),
      progressStatus: mapStatus(data.status),
      publishStatus: "PUBLISHED",
      tags: { connectOrCreate: data.tags.map(tagUpsert) },
      // ...
    },
  });
}
```

Nothing is deleted from `content/*.mdx` until Phase 3 confirms every migrated record renders
correctly against the original — recommend tagging a git commit right before deletion as a
rollback point.

## 6. Media Library

Vercel Blob as specified. One detail worth flagging up front: PCAP/Packet Tracer/video files can
exceed the ~4.5MB request body limit on serverless function routes. The correct pattern is
**client-side direct upload** — the browser uploads straight to Blob using a short-lived token
issued by a small server route (`@vercel/blob/client`'s `handleUpload`), rather than routing the
file through a Next.js API route. Images can go either path; large files need this one.

## 7. Templates, not blank documents

Each content type gets a pre-seeded TipTap JSON document (stored as a constant, not in the DB)
used when an admin clicks "New Project" / "New Lab" / etc. — matching the section headings your
spec lists (Overview/Objectives/Technologies/... for Project, Purpose/Devices/Commands/... for
Lab, and so on). This satisfies "don't present an empty editor" directly, and doubles as
onboarding for anyone who's forgotten the structure of a good writeup.

## 8. Caching & revalidation

Public pages stay statically generated (`generateStaticParams`, same as today). The gap a
database introduces is that a build no longer reflects an admin edit made afterward. Fix: admin
"Publish"/"Update" Server Actions call `revalidatePath()` / `revalidateTag()` for the affected
public routes after the DB write — on-demand ISR. Pages stay fast and static; edits go live
within seconds without a redeploy. Read queries get wrapped in React's `cache()` for
per-request memoization (e.g. a project page and its "related projects" query sharing one
underlying fetch).

## 9. Phased roadmap

Each phase is a stopping point — `npm run build` succeeds and the public site is fully
functional at the end of every one.

| Phase | Scope | Public site impact |
| --- | --- | --- |
| **0 — Foundations** | Add Prisma, connect to Neon, apply `prisma/schema.prisma`, `lib/db.ts`. No app code references Prisma yet. | None — nothing changed |
| **1 — Auth + `/admin` shell** | Auth.js, `middleware.ts`, bare dashboard nav (no content screens yet), login page | None — new disjoint routes |
| **2 — Migrate & cut over Projects only** | `prisma/seed.ts` for the 4 project MDX files, `lib/content.ts` project functions → Prisma, `content-renderer.tsx`, swap into `app/projects/**` only | `/projects/*` now DB-driven; everything else still MDX (both systems coexist temporarily) |
| **3 — Roll the same pattern to Labs, Articles, Certificates, Timeline, Skills** | Repeat Phase 2 per remaining content type; delete `content/*.mdx` and `lib/data/*.ts` once parity is confirmed | Entire public site DB-driven; MDX system fully retired |
| **4 — Admin CRUD + editor** | TipTap shell, 5 custom nodes, CRUD screens per content type, autosave + save-status, Draft/Published/Archived/Scheduled | None — additive to `/admin` |
| **5 — Media Library + templates + admin search** | Blob upload (client-direct), Media Library grid, image picker in editor, 4 content templates, admin-side search | None — additive to `/admin` |
| **6 — Cleanup & polish** | Remove now-unused MDX deps from `package.json`, verify on-demand ISR end-to-end, add caching, write up the CMS itself as a new Project entry | Slight bundle-size win; new project card on the public site (by design) |

## 10. Before I touch any code

Two decisions are cheap to make now and expensive to reverse later — I'd rather confirm them than
guess:

1. **Auth**: Credentials (email + password, zero extra accounts) or GitHub OAuth
   (allow-listed email, no password to manage)?
2. **Postgres host**: Neon or Supabase? (Neon if you just want Postgres; Supabase if you'd also
   want its storage/auth bundled in later — doesn't change the schema either way, only the
   connection string.)

Once those are set, Phase 0 is just running `prisma migrate dev` against the real database and
committing `lib/db.ts` — I can do that in the next message.
