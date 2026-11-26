import { cn } from "@invite-me/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Nothing here yet, or something went wrong: say what happened and offer the next step. */
export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("grid justify-items-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center", className)}>
      {Icon ? <Icon className="size-8 text-text-muted" aria-hidden /> : null}
      <h2 className="text-section">{title}</h2>
      {description ? <p className="max-w-prose text-text-muted">{description}</p> : null}
      {action}
    </div>
  );
}
