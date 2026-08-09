import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, TriangleAlert } from "lucide-react";
import { auth } from "@/auth";
import { Mark } from "@/components/shared/mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signInWithGitHub } from "./actions";

export const metadata: Metadata = {
  title: "Private CMS Sign-in",
  description: "Private administrator sign-in for jonasl.online using GitHub OAuth.",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
};

const errorMessages: Record<string, string> = {
  AccessDenied: "That GitHub account isn't authorized for this dashboard.",
  Configuration: "Auth isn't configured correctly — check the production authentication settings.",
};

type AdminLoginSearchParams = Promise<{ error?: string | string[] }>;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: AdminLoginSearchParams;
}) {
  const session = await auth();
  if (session?.user?.isAdmin) redirect("/admin");

  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorCode
    ? errorMessages[errorCode] ?? "Something went wrong signing in. Try again."
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle compact />
      </div>
      <div className="w-full max-w-sm border border-border-strong bg-surface-2 p-8">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <Mark size={36} />
          <div>
            <p className="label mb-2 text-cobalt">jonasl.online</p>
            <h1 className="font-display text-lg font-semibold text-text">Private CMS Access</h1>
            <p className="mt-1 text-xs leading-5 text-muted">
              Administrator sign-in for this portfolio website.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 border border-vermilion/30 bg-vermilion/10 px-3 py-2.5 text-left text-sm text-vermilion">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="mb-5 border border-border bg-surface px-3 py-3 text-xs leading-5 text-text-dim">
          <p className="font-medium text-text">Authentication is handled by GitHub OAuth.</p>
          <p className="mt-1">
            jonasl.online never asks for or stores your GitHub password. Continuing below redirects you to
            <span className="font-mono text-text"> github.com</span> for authorization.
          </p>
        </div>

        <form action={signInWithGitHub}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 border border-border-strong bg-text px-4 py-3 text-sm font-medium text-surface transition-opacity hover:opacity-85"
          >
            <Github className="h-4 w-4" /> Continue with GitHub <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </form>

        <Link
          href="/"
          className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Return to public portfolio
        </Link>
      </div>
    </div>
  );
}
