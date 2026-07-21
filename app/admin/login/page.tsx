import { redirect } from "next/navigation";
import { ShieldCheck, Github, TriangleAlert } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { signInWithGitHub } from "./actions";

const errorMessages: Record<string, string> = {
  AccessDenied: "That GitHub account isn't authorized for this dashboard.",
  Configuration: "Auth isn't configured correctly — check ADMIN_EMAIL and AUTH_GITHUB_ID/SECRET.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const session = await auth();
  if (session?.user?.isAdmin) {
    redirect("/admin");
  }

  const errorMessage = searchParams.error
    ? errorMessages[searchParams.error] ?? "Something went wrong signing in. Try again."
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-6">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <h1 className="mt-4 font-display text-lg font-semibold text-foreground">Admin sign-in</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Restricted to a single allow-listed GitHub account.
        </p>

        {errorMessage && (
          <div className="mt-5 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-left text-sm text-destructive">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            {errorMessage}
          </div>
        )}

        <form action={signInWithGitHub} className="mt-6">
          <Button type="submit" className="w-full" size="lg">
            <Github className="h-4 w-4" />
            Sign in with GitHub
          </Button>
        </form>

        <a href="/" className="mt-6 inline-block text-sm text-muted-foreground hover:text-foreground">
          ← Back to the public site
        </a>
      </div>
    </div>
  );
}
