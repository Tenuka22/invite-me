import { cn } from "@invite-me/ui/lib/utils";
import { AlertCircle, CheckCircle2, Circle, Clock, HelpCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-muted text-text",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-primary-soft text-accent-gold-text",
};
const ICON: Record<BadgeTone, LucideIcon> = {
  neutral: Circle,
  success: CheckCircle2,
  warning: HelpCircle,
  danger: AlertCircle,
  info: Clock,
};

/** A status chip. Status is never colour alone: every tone carries an icon and a label. */
export function Badge({ tone = "neutral", icon, className, children }: { tone?: BadgeTone; icon?: LucideIcon; className?: string; children: ReactNode }) {
  const Icon = icon ?? ICON[tone];
  return (
    <span className={cn("inline-flex min-h-7 items-center gap-1.5 rounded-pill px-2.5 text-label font-medium", TONE[tone], className)}>
      <Icon className="size-4 shrink-0" aria-hidden />
      {children}
    </span>
  );
}
