"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  CheckCircle2,
  Download,
  ExternalLink,
  GitFork,
  Github,
  Loader2,
  Lock,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  importGitHubRepositoryAction,
  syncGitHubProjectAction,
} from "@/app/admin/(dashboard)/projects/github-actions";

interface RepositoryItem {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  htmlUrl: string;
  description: string | null;
  homepage: string | null;
  primaryLanguage: string | null;
  topics: string[];
  fork: boolean;
  archived: boolean;
  defaultBranch: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string | null;
  linkedProject: {
    id: string;
    title: string;
    publishStatus: string;
  } | null;
}

export interface GitHubProjectSyncData {
  repositories: RepositoryItem[];
  accessMode: "app" | "public";
  appConfigured: boolean;
  appInstalled: boolean;
  appInstallUrl: string | null;
  installationAccounts: string[];
  error: string | null;
}

function formatDate(value: string | null) {
  if (!value) return "No pushes yet";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function GitHubProjectSync({ data }: { data: GitHubProjectSyncData }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.repositories;
    return data.repositories.filter((repo) =>
      `${repo.name} ${repo.fullName} ${repo.description ?? ""} ${repo.primaryLanguage ?? ""} ${repo.topics.join(" ")}`
        .toLowerCase()
        .includes(normalized),
    );
  }, [data.repositories, query]);

  const visible = showAll ? filtered : filtered.slice(0, 10);
  const linkedCount = data.repositories.filter((repo) => repo.linkedProject).length;
  const availableCount = data.repositories.length - linkedCount;

  async function importRepository(fullName: string) {
    setPendingKey(`import:${fullName}`);
    setMessage(null);
    const result = await importGitHubRepositoryAction(fullName);
    setPendingKey(null);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) router.refresh();
  }

  async function syncProject(projectId: string) {
    setPendingKey(`sync:${projectId}`);
    setMessage(null);
    const result = await syncGitHubProjectAction(projectId);
    setPendingKey(null);
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    if (result.success) router.refresh();
  }

  return (
    <section className="border border-border bg-surface">
      <div className="flex flex-col gap-5 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <Github className="h-4 w-4 text-text" />
            <span className="label">GitHub project sync</span>
          </div>
          <h2 className="text-xl font-semibold text-text">Repositories → portfolio drafts</h2>
          <p className="mt-2 text-sm leading-6 text-text-dim">
            Detect recent repositories automatically, import the ones worth presenting, and keep linked project metadata in sync without replacing your custom documentation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="border border-border bg-surface-2 px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted">
            {data.accessMode === "app" ? "GitHub App" : "Public discovery"}
          </span>
          {data.appInstalled && (
            <span className="flex items-center gap-1.5 border border-teal/30 bg-teal/10 px-3 py-2 text-xs font-medium text-teal">
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected
            </span>
          )}
          {!data.appInstalled && data.appInstallUrl && (
            <a
              href={data.appInstallUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 border border-border-strong bg-text px-3 py-2 text-xs font-medium text-surface"
            >
              <Github className="h-3.5 w-3.5" /> Connect GitHub
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-px border-b border-border bg-border sm:grid-cols-3">
        <div className="bg-surface px-5 py-4">
          <span className="label">Detected</span>
          <div className="mt-1 font-mono text-lg text-text">{data.repositories.length}</div>
        </div>
        <div className="bg-surface px-5 py-4">
          <span className="label">Linked</span>
          <div className="mt-1 font-mono text-lg text-text">{linkedCount}</div>
        </div>
        <div className="bg-surface px-5 py-4">
          <span className="label">Available to import</span>
          <div className="mt-1 font-mono text-lg text-text">{availableCount}</div>
        </div>
      </div>

      {!data.appInstalled && (
        <div className="border-b border-border bg-surface-2 px-5 py-4 text-xs leading-5 text-text-dim">
          {data.appConfigured
            ? "Public repositories are visible now. Install the configured GitHub App to include the private or selected repositories you grant it access to."
            : "Public repository discovery is already active. Configure the optional Portfolio GitHub App credentials to unlock Vercel-style selected/private repository access."}
        </div>
      )}

      {data.appInstalled && data.installationAccounts.length > 0 && (
        <div className="border-b border-border bg-surface-2 px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-muted">
          Access granted by: {data.installationAccounts.join(", ")}
        </div>
      )}

      {message && (
        <div className={`border-b px-5 py-3 text-sm ${message.type === "success" ? "border-teal/20 bg-teal/10 text-teal" : "border-vermilion/20 bg-vermilion/10 text-vermilion"}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 border border-border bg-surface-2 px-3 py-2 sm:max-w-sm">
          <Search className="h-3.5 w-3.5 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search repositories…"
            className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
          />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
          Sorted by recent GitHub activity
        </span>
      </div>

      {data.error ? (
        <div className="p-8 text-sm text-vermilion">{data.error}</div>
      ) : visible.length === 0 ? (
        <div className="p-8 text-sm text-text-dim">No repositories match this search.</div>
      ) : (
        <div className="divide-y divide-border">
          {visible.map((repo) => {
            const importing = pendingKey === `import:${repo.fullName}`;
            const syncing = repo.linkedProject && pendingKey === `sync:${repo.linkedProject.id}`;
            return (
              <div key={repo.id} className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={repo.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-sm font-semibold text-text hover:underline"
                    >
                      {repo.name}
                    </a>
                    {repo.private && (
                      <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted">
                        <Lock className="h-2.5 w-2.5" /> Private
                      </span>
                    )}
                    {repo.fork && (
                      <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted">
                        <GitFork className="h-2.5 w-2.5" /> Fork
                      </span>
                    )}
                    {repo.archived && (
                      <span className="flex items-center gap-1 border border-border px-1.5 py-0.5 font-mono text-[9px] uppercase text-muted">
                        <Archive className="h-2.5 w-2.5" /> Archived
                      </span>
                    )}
                    {repo.linkedProject && (
                      <span className="flex items-center gap-1 border border-teal/30 bg-teal/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-teal">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Linked
                      </span>
                    )}
                  </div>
                  <div className="mt-1 truncate font-mono text-[10px] text-muted">{repo.fullName}</div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-text-dim">
                    {repo.description || "No GitHub description yet."}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] uppercase tracking-wide text-muted">
                    <span>{repo.primaryLanguage || "No language"}</span>
                    <span>Pushed {formatDate(repo.pushedAt ?? repo.updatedAt)}</span>
                    {repo.topics.slice(0, 3).map((topic) => <span key={topic}>#{topic}</span>)}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <a
                    href={repo.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 border border-border px-3 py-2 text-xs text-text-dim hover:text-text"
                    aria-label={`Open ${repo.fullName} on GitHub`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> GitHub
                  </a>
                  {repo.linkedProject ? (
                    <>
                      <button
                        type="button"
                        disabled={Boolean(pendingKey)}
                        onClick={() => void syncProject(repo.linkedProject!.id)}
                        className="flex items-center gap-1.5 border border-border-strong px-3 py-2 text-xs font-medium text-text disabled:opacity-50"
                      >
                        {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        Sync
                      </button>
                      <Link
                        href={`/admin/projects/${repo.linkedProject.id}`}
                        className="flex items-center gap-1.5 border border-border-strong bg-text px-3 py-2 text-xs font-medium text-surface"
                      >
                        Open project
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(pendingKey)}
                      onClick={() => void importRepository(repo.fullName)}
                      className="flex items-center gap-1.5 border border-border-strong bg-text px-3 py-2 text-xs font-medium text-surface disabled:opacity-50"
                    >
                      {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      Import draft
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length > 10 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="w-full border-t border-border px-4 py-3 text-xs font-medium text-text-dim hover:bg-surface-2 hover:text-text"
        >
          {showAll ? "Show recent 10" : `Show all ${filtered.length} repositories`}
        </button>
      )}
    </section>
  );
}
