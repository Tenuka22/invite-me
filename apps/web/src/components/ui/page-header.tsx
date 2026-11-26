import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@invite-me/ui/lib/utils";
import type { ReactNode } from "react";

/** One title per page. Actions sit on the right and wrap under the title on narrow screens. */
export function PageHeader({ title, description, back, actions, className }: { title: string; description?: string; back?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={cn("mb-6 grid gap-3", className)}>
      {back}
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-display">{title}</h1>
          {description ? <p className="mt-1 text-text-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** A round "back" link for inner pages. */
export function BackLink({ label = "Back", ...link }: LinkProps & { label?: string }) {
  return (
    <Link {...link} aria-label={label} className="inline-flex min-h-11 w-fit items-center gap-1.5 rounded-pill pr-3 font-medium text-text-muted hover:text-text">
      <ArrowLeft className="size-5" aria-hidden />
      {label}
    </Link>
  );
}
