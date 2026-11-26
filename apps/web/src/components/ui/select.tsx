import { Select as BaseSelect } from "@base-ui/react/select";
import { cn } from "@invite-me/ui/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { CONTROL } from "./field";

export type SelectOption = { value: string; label: string; description?: string };

/** A single-choice list. `options` is the full list so the trigger can show the chosen label. */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Choose one",
  "aria-label": ariaLabel,
  className,
}: {
  value: string | null;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}) {
  const items = options.map((o) => ({ value: o.value, label: o.label }));
  return (
    <BaseSelect.Root value={value} onValueChange={(v) => v != null && onValueChange(v as string)} items={items}>
      <BaseSelect.Trigger aria-label={ariaLabel} className={cn(CONTROL, "flex items-center justify-between gap-2 text-left data-[popup-open]:border-focus-ring", className)}>
        <BaseSelect.Value placeholder={placeholder} />
        <BaseSelect.Icon>
          <ChevronDown className="size-5 text-text-muted" aria-hidden />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner sideOffset={6} className="host-app z-50 outline-none">
          <BaseSelect.Popup className="max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-2xl border border-border bg-surface-raised p-1.5 text-text shadow-overlay outline-none transition-[transform,opacity] duration-(--duration-fast) data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            <BaseSelect.List>
              {options.map((o) => (
                <BaseSelect.Item key={o.value} value={o.value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 outline-none data-[highlighted]:bg-primary-soft">
                  <BaseSelect.ItemIndicator className="w-5">
                    <Check className="size-5 text-primary" aria-hidden />
                  </BaseSelect.ItemIndicator>
                  <span className="grid">
                    <BaseSelect.ItemText>{o.label}</BaseSelect.ItemText>
                    {o.description ? <span className="text-label text-text-muted">{o.description}</span> : null}
                  </span>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}

export type { ReactNode };
