import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { cn } from "@invite-me/ui/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export const CONTROL =
  "w-full min-h-12 rounded-xl border border-border-strong bg-surface-raised px-4 py-2 text-body text-text " +
  "placeholder:text-text-placeholder transition-colors duration-(--duration-fast) " +
  "focus-visible:border-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring " +
  "data-[invalid]:border-danger disabled:opacity-60";

type FieldProps = {
  label: string;
  /** Helper text under the control. */
  description?: string;
  /** Inline error. Say how to fix it. */
  error?: string;
  /** Marks the label "optional". */
  optional?: boolean;
  className?: string;
  children?: ReactNode;
};

/** Label, helper, control and inline error, linked for screen readers. Wrap any control that is a Field.Control. */
export function Field({ label, description, error, optional, className, children }: FieldProps) {
  return (
    <BaseField.Root invalid={Boolean(error)} className={cn("grid gap-1.5", className)}>
      <BaseField.Label className="text-label font-medium text-text">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-text-muted">(optional)</span> : null}
      </BaseField.Label>
      {children}
      {description ? <BaseField.Description className="text-label text-text-muted">{description}</BaseField.Description> : null}
      <BaseField.Error match={Boolean(error)} className="text-label font-medium text-danger">
        {error}
      </BaseField.Error>
    </BaseField.Root>
  );
}

export function Input({ className, ...props }: Omit<ComponentProps<typeof BaseField.Control>, "className"> & { className?: string }) {
  return <BaseField.Control {...props} className={cn(CONTROL, className)} />;
}

export function Textarea({ className, ...props }: Omit<ComponentProps<"textarea">, "className"> & { className?: string }) {
  return <BaseField.Control render={<textarea rows={3} />} {...(props as object)} className={cn(CONTROL, "min-h-24 resize-y", className)} />;
}

/** A labelled group of related controls (radio sets, checkbox sets). */
export function Fieldset({ legend, description, className, children }: { legend: string; description?: string; className?: string; children: ReactNode }) {
  return (
    <BaseFieldset.Root className={cn("grid gap-3", className)}>
      <BaseFieldset.Legend className="text-label font-medium text-text">{legend}</BaseFieldset.Legend>
      {description ? <p className="-mt-2 text-label text-text-muted">{description}</p> : null}
      {children}
    </BaseFieldset.Root>
  );
}
