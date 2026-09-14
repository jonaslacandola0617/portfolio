import "server-only";

import { createSign } from "node:crypto";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";
const USER_AGENT = "jonasl-portfolio-project-sync";

interface GitHubAppInstallation {
  id: number;
  account: {
    login: string;
    type: string;
  } | null;
}

interface GitHubInstallationToken {
  token: string;
  expires_at: string;
}

interface GitHubInstallationRepositoriesResponse {
  repositories: GitHubRepositoryApi[];
}

interface GitHubRepositoryApi {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  fork: boolean;
  archived: boolean;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string | null;
}

export interface GitHubProjectRepository {
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
}

export interface GitHubRepositorySource {
  repositories: GitHubProjectRepository[];
  accessMode: "app" | "public";
  appConfigured: boolean;
  appInstalled: boolean;
  appInstallUrl: string | null;
  installationAccounts: string[];
  error: string | null;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function githubAppConfig() {
  const appId = process.env.GITHUB_PROJECT_APP_ID?.trim() ?? "";
  const appSlug = process.env.GITHUB_PROJECT_APP_SLUG?.trim() ?? "";
  const privateKey = (process.env.GITHUB_PROJECT_APP_PRIVATE_KEY ?? "")
    .replace(/^"|"$/g, "")
    .replace(/\\n/g, "\n")
    .trim();

  return {
    appId,
    appSlug,
    privateKey,
    configured: Boolean(appId && privateKey),
    installUrl: appSlug ? `https://github.com/apps/${appSlug}/installations/new` : null,
  };
}

function createAppJwt(appId: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: appId }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64url");
  return `${unsigned}.${signature}`;
}

async function githubRequest<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...requestOptions } = options;
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...requestOptions,
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": USER_AGENT,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`GitHub API ${response.status}: ${detail.slice(0, 240) || response.statusText}`);
  }

  return response.json() as Promise<T>;
}

function mapRepository(repo: GitHubRepositoryApi): GitHubProjectRepository {
  return {
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    htmlUrl: repo.html_url,
    description: repo.description,
    homepage: repo.homepage,
    primaryLanguage: repo.language,
    topics: repo.topics ?? [],
    fork: repo.fork,
    archived: repo.archived,
    defaultBranch: repo.default_branch,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
    pushedAt: repo.pushed_at,
  };
}

async function listAppInstallations() {
  const config = githubAppConfig();
  if (!config.configured) return [];

  const jwt = createAppJwt(config.appId, config.privateKey);
  return githubRequest<GitHubAppInstallation[]>("/app/installations?per_page=100", { token: jwt });
}

async function createInstallationToken(installationId: number) {
  const config = githubAppConfig();
  if (!config.configured) throw new Error("GitHub App credentials are not configured.");

  const jwt = createAppJwt(config.appId, config.privateKey);
  const result = await githubRequest<GitHubInstallationToken>(
    `/app/installations/${installationId}/access_tokens`,
    { method: "POST", token: jwt },
  );
  return result.token;
}

async function listInstallationRepositories(installation: GitHubAppInstallation) {
  const token = await createInstallationToken(installation.id);
  const repositories: GitHubRepositoryApi[] = [];

  for (let page = 1; page <= 10; page += 1) {
    const result = await githubRequest<GitHubInstallationRepositoriesResponse>(
      `/installation/repositories?per_page=100&page=${page}`,
      { token },
    );
    repositories.push(...result.repositories);
    if (result.repositories.length < 100) break;
  }

  return repositories;
}

async function listPublicRepositories(owner: string) {
  return githubRequest<GitHubRepositoryApi[]>(
    `/users/${encodeURIComponent(owner)}/repos?per_page=100&type=owner&sort=pushed&direction=desc`,
  );
}

export function githubOwnerFromUrl(githubUrl: string | null | undefined) {
  if (!githubUrl) return null;
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    return url.pathname.split("/").filter(Boolean)[0] ?? null;
  } catch {
    return null;
  }
}

export function normalizeGitHubRepositoryUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const parts = url.pathname.replace(/\.git$/i, "").split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return `https://github.com/${parts[0].toLowerCase()}/${parts[1].toLowerCase()}`;
  } catch {
    return null;
  }
}

export async function getGitHubRepositorySource(owner: string): Promise<GitHubRepositorySource> {
  const config = githubAppConfig();

  if (config.configured) {
    try {
      const installations = await listAppInstallations();
      if (installations.length > 0) {
        const groups = await Promise.all(installations.map((installation) => listInstallationRepositories(installation)));
        const repositories = Array.from(
          new Map(groups.flat().map((repo) => [repo.id, repo])).values(),
        )
          .map(mapRepository)
          .sort((a, b) => (b.pushedAt ?? b.updatedAt).localeCompare(a.pushedAt ?? a.updatedAt));

        return {
          repositories,
          accessMode: "app",
          appConfigured: true,
          appInstalled: true,
          appInstallUrl: config.installUrl,
          installationAccounts: installations
            .map((installation) => installation.account?.login)
            .filter((login): login is string => Boolean(login)),
          error: null,
        };
      }
    } catch (error) {
      console.error("[github-project-sync] GitHub App discovery failed", error);
    }
  }

  try {
    const repositories = (await listPublicRepositories(owner)).map(mapRepository);
    return {
      repositories,
      accessMode: "public",
      appConfigured: config.configured,
      appInstalled: false,
      appInstallUrl: config.installUrl,
      installationAccounts: [],
      error: null,
    };
  } catch (error) {
    console.error("[github-project-sync] public repository discovery failed", error);
    return {
      repositories: [],
      accessMode: "public",
      appConfigured: config.configured,
      appInstalled: false,
      appInstallUrl: config.installUrl,
      installationAccounts: [],
      error: "GitHub repositories could not be loaded right now.",
    };
  }
}

async function repositoryToken(fullName: string) {
  const config = githubAppConfig();
  if (!config.configured) return null;

  const owner = fullName.split("/")[0]?.toLowerCase();
  if (!owner) return null;

  const installations = await listAppInstallations();
  const installation = installations.find(
    (candidate) => candidate.account?.login.toLowerCase() === owner,
  );
  return installation ? createInstallationToken(installation.id) : null;
}

export async function getGitHubRepositoryDetails(fullName: string) {
  const token = await repositoryToken(fullName).catch(() => null);
  const repo = await githubRequest<GitHubRepositoryApi>(`/repos/${fullName}`, { token: token ?? undefined });
  const languages = await githubRequest<Record<string, number>>(`/repos/${fullName}/languages`, {
    token: token ?? undefined,
  });

  return {
    repository: mapRepository(repo),
    languages: Object.entries(languages)
      .sort((a, b) => b[1] - a[1])
      .map(([language]) => language),
  };
}
