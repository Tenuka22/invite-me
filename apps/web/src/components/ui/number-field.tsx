import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { cn } from "@invite-me/ui/lib/utils";
import { Minus, Plus } from "lucide-react";

const STEP = "grid size-12 shrink-0 place-items-center rounded-pill border border-border-strong bg-surface-raised outline-none transition-colors duration-(--duration-fast) hover:bg-primary-soft disabled:opacity-40";

/** A stepper for small counts such as seats. 48px buttons either side of the number. */
export function NumberField({ value, onValueChange, min = 1, max = 50, label, className }: { value: number; onValueChange: (value: number) => void; min?: number; max?: number; label: string; className?: string }) {
  return (
    <BaseNumberField.Root value={value} onValueChange={(v) => v != null && onValueChange(v)} min={min} max={max} step={1} smallStep={1} className={cn("grid gap-1.5", className)}>
      <BaseNumberField.Group className="flex items-center gap-2">
        <BaseNumberField.Decrement aria-label={`Fewer: ${label}`} className={STEP}>
          <Minus className="size-5" aria-hidden />
        </BaseNumberField.Decrement>
        <BaseNumberField.Input aria-label={label} className="h-12 w-20 rounded-xl border border-border-strong bg-surface-raised text-center text-body font-semibold tabular-nums outline-none focus-visible:border-focus-ring" />
        <BaseNumberField.Increment aria-label={`More: ${label}`} className={STEP}>
          <Plus className="size-5" aria-hidden />
        </BaseNumberField.Increment>
      </BaseNumberField.Group>
    </BaseNumberField.Root>
  );
}
