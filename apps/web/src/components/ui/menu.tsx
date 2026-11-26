import { Menu as BaseMenu } from "@base-ui/react/menu";
import { cn } from "@invite-me/ui/lib/utils";
import type { ComponentProps } from "react";

export const Menu = BaseMenu.Root;
export const MenuTrigger = BaseMenu.Trigger;

export function MenuContent({ className, align = "end", children }: { className?: string; align?: "start" | "center" | "end"; children: React.ReactNode }) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner align={align} sideOffset={8} className="host-app z-50 outline-none">
        <BaseMenu.Popup
          className={cn(
            "min-w-52 origin-(--transform-origin) rounded-2xl border border-border bg-surface-raised p-1.5 text-text shadow-overlay outline-none",
            "transition-[transform,opacity] duration-(--duration-fast) ease-(--ease-out) data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            className,
          )}
        >
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export function MenuItem({ className, danger, ...props }: ComponentProps<typeof BaseMenu.Item> & { danger?: boolean }) {
  return (
    <BaseMenu.Item
      {...props}
      className={cn(
        "flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-xl px-3 text-body outline-none",
        "data-[highlighted]:bg-primary-soft data-[disabled]:opacity-50",
        danger && "text-danger",
        className as string,
      )}
    />
  );
}

export function MenuSeparator() {
  return <BaseMenu.Separator className="my-1.5 h-px bg-border" />;
}
