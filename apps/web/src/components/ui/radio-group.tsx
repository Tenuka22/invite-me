import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { cn } from "@invite-me/ui/lib/utils";
import type { ReactNode } from "react";

export type RadioOption = { value: string; label: string; description?: string; leading?: ReactNode; disabled?: boolean };

/**
 * One choice from a few. Each option is a full-width 44px+ row so the whole row is the target.
 * For two or three short options prefer SegmentedControl.
 */
export function RadioGroup({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  columns,
  tiles,
  className,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly RadioOption[];
  "aria-label"?: string;
  "aria-labelledby"?: string;
  /** Lay options out in a grid of this many columns from sm up. */
  columns?: 2 | 3;
  /** From sm up, show options as equal tiles in one row (avatar above label); the radio dot is hidden but stays focusable. */
  tiles?: boolean;
  className?: string;
}) {
  return (
    <BaseRadioGroup
      value={value}
      onValueChange={(v) => onValueChange(v as string)}
      aria-label={ariaLabel}
      aria-labelledby={labelledBy}
      className={cn("grid gap-2", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3", tiles && "sm:grid-cols-5", className)}
    >
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            "relative flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-border-strong bg-surface-raised px-4 py-2",
            tiles && "sm:flex-col sm:justify-start sm:gap-2 sm:px-2 sm:py-3 sm:text-center",
            "transition-colors duration-(--duration-fast) has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary-soft has-[[data-disabled]]:opacity-50",
            "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring",
          )}
        >
          <Radio.Root
            data-tile={tiles ? "" : undefined}
            value={o.value}
            disabled={o.disabled}
            className="grid size-6 shrink-0 place-items-center rounded-pill border-2 border-border-strong bg-surface-raised outline-none data-[checked]:border-primary data-[tile]:sm:sr-only"
          >
            <Radio.Indicator className="size-3 rounded-pill bg-primary" />
          </Radio.Root>
          {o.leading}
          <span className={cn("grid min-w-0", tiles && "sm:justify-items-center")}>
            <span className="font-medium">{o.label}</span>
            {o.description ? <span className="text-label text-text-muted">{o.description}</span> : null}
          </span>
        </label>
      ))}
    </BaseRadioGroup>
  );
}
