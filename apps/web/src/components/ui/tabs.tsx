import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import { cn } from "@invite-me/ui/lib/utils";
import type { ComponentProps } from "react";

export const Tabs = BaseTabs.Root;
export const TabsPanel = BaseTabs.Panel;

export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabs.List>) {
  return <BaseTabs.List {...props} className={cn("relative inline-flex gap-1 rounded-pill bg-muted p-1", className as string)} />;
}

export function Tab({ className, ...props }: ComponentProps<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      {...props}
      className={cn(
        "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-pill px-4 text-body font-medium text-text-muted outline-none",
        "transition-colors duration-(--duration-fast) hover:text-text data-[active]:bg-surface-raised data-[active]:text-text data-[active]:shadow-raised",
        className as string,
      )}
    />
  );
}
