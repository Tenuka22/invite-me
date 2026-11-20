import type { CSSProperties } from "react";

/** Placeholder block for content that is still loading. Decorative: the container carries the status. */
export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={style}
      className={`rounded-md bg-foreground/15 motion-safe:animate-pulse ${className ?? ""}`}
    />
  );
}
