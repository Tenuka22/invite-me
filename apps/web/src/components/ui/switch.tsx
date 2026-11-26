import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@invite-me/ui/lib/utils";
import { Check } from "lucide-react";

/** On/off setting with its label and a one-line description; the whole row is the target. */
export function Switch({ checked, onCheckedChange, label, description, className }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string; description?: string; className?: string }) {
  return (
    <label className={cn("flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border-strong bg-surface-raised px-4 py-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring", className)}>
      <span className="grid min-w-0">
        <span className="font-medium">{label}</span>
        {description ? <span className="text-label text-text-muted">{description}</span> : null}
      </span>
      <BaseSwitch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="relative h-7 w-12 shrink-0 rounded-pill bg-border-strong outline-none transition-colors duration-(--duration-fast) data-[checked]:bg-primary"
      >
        <BaseSwitch.Thumb className="block size-6 translate-x-0.5 rounded-pill bg-surface-raised shadow-raised transition-transform duration-(--duration-fast) ease-(--ease-out) data-[checked]:translate-x-[1.375rem]" />
      </BaseSwitch.Root>
    </label>
  );
}

export function Checkbox({ checked, onCheckedChange, label, className }: { checked: boolean; onCheckedChange: (checked: boolean) => void; label: string; className?: string }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3", className)}>
      <BaseCheckbox.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="grid size-6 shrink-0 place-items-center rounded-md border-2 border-border-strong bg-surface-raised outline-none data-[checked]:border-primary data-[checked]:bg-primary"
      >
        <BaseCheckbox.Indicator>
          <Check className="size-4 text-primary-foreground" aria-hidden />
        </BaseCheckbox.Indicator>
      </BaseCheckbox.Root>
      <span>{label}</span>
    </label>
  );
}
