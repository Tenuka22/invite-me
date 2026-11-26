import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cn } from "@invite-me/ui/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "./button";

export const Dialog = BaseDialog.Root;
export const DialogTrigger = BaseDialog.Trigger;
export const DialogClose = BaseDialog.Close;

const BACKDROP =
  "host-app fixed inset-0 z-50 bg-overlay transition-opacity duration-(--duration-base) ease-(--ease-out) data-[starting-style]:opacity-0 data-[ending-style]:opacity-0";

/** Below md the popup is a bottom sheet; from md up it is a centred dialog. */
const POPUP =
  "host-app fixed z-50 flex flex-col overflow-hidden bg-surface-raised text-text shadow-overlay outline-none " +
  "transition-[transform,opacity] duration-(--duration-slow) ease-(--ease-out) " +
  "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full " +
  "md:inset-auto md:left-1/2 md:top-1/2 md:w-[min(100%-2rem,var(--dialog-w,32rem))] md:max-h-[min(90dvh,48rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl " +
  "md:data-[starting-style]:translate-y-[calc(-50%+1rem)] md:data-[starting-style]:opacity-0 md:data-[ending-style]:translate-y-[calc(-50%+1rem)] md:data-[ending-style]:opacity-0";

const WIDTH = { sm: "28rem", md: "32rem", lg: "44rem", xl: "60rem" } as const;

export function DialogContent({
  title,
  description,
  footer,
  size = "md",
  hideTitle,
  className,
  children,
}: {
  title: string;
  description?: string;
  /** Sticky footer: the dialog's actions. */
  footer?: ReactNode;
  size?: keyof typeof WIDTH;
  /** Keep the title for screen readers only (for example a full preview). */
  hideTitle?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className={BACKDROP} />
      <BaseDialog.Popup className={cn(POPUP, className)} style={{ ["--dialog-w" as string]: WIDTH[size] }}>
        <div className={cn("flex items-start justify-between gap-4 px-5 pt-5 md:px-6", hideTitle && "sr-only")}>
          <div className="min-w-0">
            <BaseDialog.Title className="text-section">{title}</BaseDialog.Title>
            {description ? <BaseDialog.Description className="mt-1 text-text-muted">{description}</BaseDialog.Description> : null}
          </div>
        </div>
        <BaseDialog.Close render={<Button variant="ghost" size="icon" aria-label="Close" className="absolute right-3 top-3" />}>
          <X className="size-5" aria-hidden />
        </BaseDialog.Close>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4 md:px-6", hideTitle && "pt-5")}>{children}</div>
        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface-raised px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 md:px-6 md:pb-4">
            {footer}
          </div>
        ) : null}
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
}

export const AlertDialog = BaseAlertDialog.Root;
export const AlertDialogTrigger = BaseAlertDialog.Trigger;

/** Confirmation for irreversible actions only. Prefer an Undo toast for anything that can be undone. */
export function AlertDialogContent({
  title,
  description,
  confirmLabel,
  onConfirm,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <BaseAlertDialog.Portal>
      <BaseAlertDialog.Backdrop className={BACKDROP} />
      <BaseAlertDialog.Popup className={cn(POPUP, "md:[--dialog-w:28rem]")}>
        <div className="grid gap-1 px-5 pt-5 md:px-6">
          <BaseAlertDialog.Title className="text-section">{title}</BaseAlertDialog.Title>
          <BaseAlertDialog.Description className="text-text-muted">{description}</BaseAlertDialog.Description>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5 md:px-6 md:pb-5">
          <BaseAlertDialog.Close render={<Button variant="secondary" />}>Keep it</BaseAlertDialog.Close>
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </BaseAlertDialog.Popup>
    </BaseAlertDialog.Portal>
  );
}
