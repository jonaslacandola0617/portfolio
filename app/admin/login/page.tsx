import { redirect } from "next/navigation";
import { Github, TriangleAlert } from "lucide-react";
import { auth } from "@/auth";
import { Mark } from "@/components/shared/mark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { signInWithGitHub } from "./actions";

const errorMessages: Record<string, string> = {
  AccessDenied: "That GitHub account isn't authorized for this dashboard.",
  Configuration: "Auth isn't configured correctly — check the production authentication settings.",
};

export default async function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const session = await auth();
  if (session?.user?.isAdmin) redirect("/admin");
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] ?? "Something went wrong signing in. Try again." : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="absolute right-4 top-4"><ThemeToggle compact /></div>
      <div className="w-full max-w-sm border border-border-strong bg-surface-2 p-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Mark size={36} />
          <div>
            <h1 className="font-display text-lg font-semibold text-text">CMS Access</h1>
            <p className="mt-1 text-xs text-muted">Portfolio administration</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-5 flex items-start gap-2 border border-vermilion/30 bg-vermilion/10 px-3 py-2.5 text-left text-sm text-vermilion">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <form action={signInWithGitHub}>
          <button type="submit" className="flex w-full items-center justify-center gap-2 border border-border-strong bg-text px-4 py-3 text-sm font-medium text-surface transition-opacity hover:opacity-85">
            <Github className="h-4 w-4" /> Sign in with GitHub
          </button>
        </form>
        <p className="mt-6 text-center text-[11px] text-muted">Authentication remains powered by the production Auth.js configuration.</p>
      </div>
    </div>
  );
}
