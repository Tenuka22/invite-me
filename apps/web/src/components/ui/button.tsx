import { Button as BaseButton } from "@base-ui/react/button";
import { cn } from "@invite-me/ui/lib/utils";
import { Loader2 } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "lg" | "icon";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-raised",
  secondary: "bg-surface-raised text-text border border-border-strong hover:bg-primary-soft",
  ghost: "bg-transparent text-text hover:bg-primary-soft",
  danger: "bg-danger text-primary-foreground hover:brightness-90 shadow-raised",
};
const SIZE: Record<ButtonSize, string> = {
  md: "h-11 min-w-11 px-5 text-body",
  lg: "h-12 min-w-12 px-6 text-body",
  icon: "size-11 p-0",
};

/** Class names for anything that must look like a Button but is not one (for example a router Link). */
export function buttonStyles({ variant = "primary", size = "md", className }: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}) {
  return cn(
    "inline-flex shrink-0 select-none items-center justify-center gap-2 rounded-pill font-semibold no-underline",
    "transition-[background-color,filter,transform] duration-(--duration-fast) ease-(--ease-out) active:scale-[0.98]",
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 disabled:cursor-not-allowed disabled:opacity-50",
    VARIANT[variant],
    SIZE[size],
    className,
  );
}

export type ButtonProps = Omit<ComponentProps<typeof BaseButton>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Shows a spinner, announces busy, and blocks further presses. */
  loading?: boolean;
  /** Icon shown before the label. */
  icon?: ReactNode;
};

export function Button({ variant, size, className, loading, icon, disabled, children, ...props }: ButtonProps) {
  return (
    <BaseButton
      type="button"
      {...props}
      disabled={disabled || loading}
      focusableWhenDisabled={loading}
      aria-busy={loading || undefined}
      className={buttonStyles({ variant, size, className })}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </BaseButton>
  );
}
