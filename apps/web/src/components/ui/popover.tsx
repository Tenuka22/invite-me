import { Popover as BasePopover } from "@base-ui/react/popover";
import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { cn } from "@invite-me/ui/lib/utils";
import type { ReactNode } from "react";

export const Popover = BasePopover.Root;
export const PopoverTrigger = BasePopover.Trigger;

export function PopoverContent({ title, className, align = "end", children }: { title?: string; className?: string; align?: "start" | "center" | "end"; children: ReactNode }) {
  return (
    <BasePopover.Portal>
      <BasePopover.Positioner align={align} sideOffset={8} className="host-app z-50 outline-none">
        <BasePopover.Popup
          className={cn(
            "w-[min(calc(100vw-2rem),22rem)] origin-(--transform-origin) rounded-2xl border border-border bg-surface-raised p-4 text-text shadow-overlay outline-none",
            "transition-[transform,opacity] duration-(--duration-fast) ease-(--ease-out) data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
        >
          {title ? <BasePopover.Title className="mb-2 text-label font-semibold">{title}</BasePopover.Title> : null}
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  );
}

export const TooltipProvider = BaseTooltip.Provider;

/**
 * A short definition on hover and keyboard focus. Touch users cannot hover, so never put anything
 * essential here: pair it with visible text.
 */
export function Tooltip({ content, children }: { content: ReactNode; children: React.ReactElement }) {
  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner sideOffset={6} className="host-app z-50">
          <BaseTooltip.Popup className="max-w-64 rounded-xl bg-text px-3 py-2 text-label text-background shadow-overlay transition-opacity duration-(--duration-fast) data-[starting-style]:opacity-0 data-[ending-style]:opacity-0">
            {content}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}
