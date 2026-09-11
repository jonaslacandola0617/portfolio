import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ExternalLink, Github, TriangleAlert } from "lucide-react";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signInWithGitHub } from "./actions";

export const metadata: Metadata = {
  title: "Private CMS Sign-in",
  description: "Private administrator sign-in for jonasl.online using GitHub OAuth.",
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

const errorMessages: Record<string, string> = {
  AccessDenied: "That GitHub account isn't authorized for this dashboard.",
  Configuration: "Auth isn't configured correctly — check the production authentication settings.",
};

type AdminLoginSearchParams = Promise<{ error?: string | string[] }>;

export default async function AdminLoginPage({ searchParams }: { searchParams: AdminLoginSearchParams }) {
  const session = await auth();
  if (session?.user?.isAdmin) redirect("/admin");

  const { error } = await searchParams;
  const errorCode = Array.isArray(error) ? error[0] : error;
  const errorMessage = errorCode ? errorMessages[errorCode] ?? "Something went wrong signing in. Try again." : null;

  return (
    <div className="admin-control-login">
      <div className="absolute right-5 top-5 admin-theme-toggle"><ThemeToggle compact /></div>
      <section className="admin-control-login-card">
        <div className="admin-control-wordmark" aria-label="JL Admin">
          <strong>JL<i>/</i></strong>
          <span>ADMIN</span>
        </div>

        <span>PRIVATE / ACCESS</span>
        <h1>Portfolio<br />admin.</h1>
        <p>Manage projects, labs, journal entries, credentials, media, and public site settings.</p>

        {errorMessage && (
          <div className="mt-6 flex items-start gap-2 border border-vermilion/40 px-3 py-2.5 text-left text-sm text-vermilion">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <div className="admin-control-login-note">
          <strong className="font-medium text-text">GitHub OAuth</strong>
          <p className="mt-1">jonasl.online never asks for or stores your GitHub password.</p>
        </div>

        <form action={signInWithGitHub}>
          <button type="submit" className="admin-control-login-button">
            <Github className="h-4 w-4" /> Continue with GitHub <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </form>

        <Link href="/" className="admin-control-login-back">
          <ArrowLeft className="h-3.5 w-3.5" /> Return to public portfolio
        </Link>
      </section>
    </div>
  );
}
