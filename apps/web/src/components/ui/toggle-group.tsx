import { ToggleGroup as BaseToggleGroup } from "@base-ui/react/toggle-group";
import { Toggle } from "@base-ui/react/toggle";
import { cn } from "@invite-me/ui/lib/utils";
import type { ReactNode } from "react";

export type SegmentOption = { value: string; label: string; icon?: ReactNode };

/** A segmented control: exactly one option is always on (paper size, single/couple/group). */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SegmentOption[];
  "aria-label": string;
  className?: string;
}) {
  return (
    <BaseToggleGroup
      value={[value]}
      onValueChange={(next) => {
        // Pressing the active segment would switch it off; a segmented control keeps one on.
        const picked = next[0];
        if (picked) onValueChange(picked);
      }}
      aria-label={ariaLabel}
      className={cn("inline-flex w-full gap-1 rounded-pill bg-muted p-1", className)}
    >
      {options.map((o) => (
        <Toggle
          key={o.value}
          value={o.value}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill px-3 font-medium text-text-muted outline-none transition-colors duration-(--duration-fast) hover:text-text data-[pressed]:bg-surface-raised data-[pressed]:text-text data-[pressed]:shadow-raised"
        >
          {o.icon}
          {o.label}
        </Toggle>
      ))}
    </BaseToggleGroup>
  );
}

/** Filter chips: any number may be on, or none. */
export function FilterChips({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SegmentOption[];
  "aria-label": string;
  className?: string;
}) {
  return (
    <BaseToggleGroup
      value={[value]}
      onValueChange={(next) => onValueChange(next[0] ?? options[0]!.value)}
      aria-label={ariaLabel}
      className={cn("flex gap-2 overflow-x-auto pb-1", className)}
    >
      {options.map((o) => (
        <Toggle
          key={o.value}
          value={o.value}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill border border-border-strong bg-surface-raised px-4 font-medium outline-none transition-colors duration-(--duration-fast) data-[pressed]:border-primary data-[pressed]:bg-primary-soft"
        >
          {o.icon}
          {o.label}
        </Toggle>
      ))}
    </BaseToggleGroup>
  );
}
