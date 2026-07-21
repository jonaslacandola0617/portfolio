import Link from "next/link";
import { cn, slugify } from "@/lib/utils";

export function Tag({ children, className, count }: { children: string; className?: string; count?: number }) {
  return (
    <Link
      href={`/tags/${slugify(children)}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-[0.7rem] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary",
        className
      )}
    >
      #{children}
      {typeof count === "number" && <span className="text-muted-foreground/60">{count}</span>}
    </Link>
  );
}
