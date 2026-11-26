import { Accordion as BaseAccordion } from "@base-ui/react/accordion";
import { Collapsible as BaseCollapsible } from "@base-ui/react/collapsible";
import { cn } from "@invite-me/ui/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** "More options": hides the rarely needed controls until asked. */
export function Collapsible({ label, defaultOpen, className, children }: { label: string; defaultOpen?: boolean; className?: string; children: ReactNode }) {
  return (
    <BaseCollapsible.Root defaultOpen={defaultOpen} className={cn("grid gap-3", className)}>
      <BaseCollapsible.Trigger className="group flex min-h-11 w-fit items-center gap-2 rounded-pill px-1 font-medium text-text outline-none">
        {label}
        <ChevronDown className="size-5 transition-transform duration-(--duration-fast) group-data-[panel-open]:rotate-180" aria-hidden />
      </BaseCollapsible.Trigger>
      <BaseCollapsible.Panel className="grid gap-4 overflow-hidden data-[starting-style]:h-0 data-[ending-style]:h-0 h-(--collapsible-panel-height) transition-[height] duration-(--duration-base) ease-(--ease-out)">
        {children}
      </BaseCollapsible.Panel>
    </BaseCollapsible.Root>
  );
}

export const Accordion = BaseAccordion.Root;

export function AccordionItem({ value, title, children }: { value: string; title: ReactNode; children: ReactNode }) {
  return (
    <BaseAccordion.Item value={value} className="border-b border-border">
      <BaseAccordion.Header>
        <BaseAccordion.Trigger className="group flex min-h-14 w-full items-center justify-between gap-3 text-left font-medium outline-none">
          {title}
          <ChevronDown className="size-5 shrink-0 transition-transform duration-(--duration-fast) group-data-[panel-open]:rotate-180" aria-hidden />
        </BaseAccordion.Trigger>
      </BaseAccordion.Header>
      <BaseAccordion.Panel className="h-(--accordion-panel-height) overflow-hidden transition-[height] duration-(--duration-base) ease-(--ease-out) data-[starting-style]:h-0 data-[ending-style]:h-0">
        <div className="pb-4">{children}</div>
      </BaseAccordion.Panel>
    </BaseAccordion.Item>
  );
}
