import { Avatar as BaseAvatar } from "@base-ui/react/avatar";
import { Progress as BaseProgress } from "@base-ui/react/progress";
import { cn } from "@invite-me/ui/lib/utils";
import type { ReactNode } from "react";

/** A labelled bar. `label` is read aloud; `children` is the visible headline. */
export function Progress({ value, max = 100, label, className, children }: { value: number; max?: number; label: string; className?: string; children?: ReactNode }) {
  return (
    <BaseProgress.Root value={value} max={max} aria-label={label} className={cn("grid gap-2", className)}>
      {children}
      <BaseProgress.Track className="h-2.5 overflow-hidden rounded-pill bg-muted">
        <BaseProgress.Indicator className="h-full rounded-pill bg-success transition-[width] duration-(--duration-slow) ease-(--ease-out)" />
      </BaseProgress.Track>
    </BaseProgress.Root>
  );
}

export function Avatar({ src, name, size = 44, className, children }: { src?: string; name: string; size?: number; className?: string; children?: ReactNode }) {
  const initials = name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <BaseAvatar.Root style={{ width: size, height: size }} className={cn("inline-grid shrink-0 place-items-center overflow-hidden rounded-pill bg-primary-soft text-label font-semibold text-text", className)}>
      {src ? <BaseAvatar.Image src={src} alt="" className="size-full object-cover" /> : null}
      <BaseAvatar.Fallback>{children ?? initials}</BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
