import { cn } from "@invite-me/ui/lib/utils";

/** A loading placeholder that shimmers on the compositor (see `.sk` in index.css). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("sk rounded-xl", className)} />;
}
