import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-card">
          <SearchX className="h-6 w-6 text-primary" />
        </div>
        <p className="font-mono text-xs text-muted-foreground">error · 404</p>
        <h1 className="mt-2 font-display text-2xl font-semibold text-foreground">
          This route doesn&rsquo;t resolve
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have moved.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </Button>
      </div>
    </div>
  );
}
