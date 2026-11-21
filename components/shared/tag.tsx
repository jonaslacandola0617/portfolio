import Link from "next/link";
import { cn, slugify } from "@/lib/utils";

/** Topic chip linking to its tag page. */
export function Tag({ children, className, count }: { children: string; className?: string; count?: number }) {
  return (
    <Link href={`/tags/${slugify(children)}`} className={cn("tag-chip", className)}>
      {children}
      {typeof count === "number" ? <span className="tag-chip-count">{count}</span> : null}
    </Link>
  );
}
