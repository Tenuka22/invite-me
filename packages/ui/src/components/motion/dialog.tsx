"use client";
// beui.dev/components/motion/dialog

// A modal on Base UI's accessible primitive (focus trap, Escape, labelled by its title). It is a
// bottom sheet on phones and a centred card from `sm` up. Motion is CSS only.

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import type { ComponentProps } from "react";

import { cn } from "@invite-me/ui/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({ className, children, ...props }: ComponentProps<typeof DialogPrimitive.Popup>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/30 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
      <DialogPrimitive.Popup
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex max-h-[90svh] flex-col overflow-y-auto rounded-t-2xl bg-background p-6 shadow-[0_-12px_40px_-12px_oklch(0.26_0.035_40/0.35)] transition duration-200 data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[min(30rem,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:shadow-[0_24px_60px_-20px_oklch(0.26_0.035_40/0.35)] sm:data-[ending-style]:translate-y-[-45%] sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:translate-y-[-45%] sm:data-[starting-style]:opacity-0",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}
