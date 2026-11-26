import { Toast } from "@base-ui/react/toast";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastOptions = {
  description?: string;
  /** A button on the toast, for example Undo or Retry. */
  action?: { label: string; onClick: () => void };
  /** Milliseconds before it goes away. Toasts with an action stay longer. */
  timeout?: number;
};

const manager = Toast.createToastManager();

function push(type: "info" | "success" | "error", title: string, options?: ToastOptions) {
  const id = manager.add({
    title,
    description: options?.description,
    type,
    timeout: options?.timeout ?? (options?.action ? 8000 : type === "error" ? 7000 : 4200),
    actionProps: options?.action
      ? {
          children: options.action.label,
          onClick: () => {
            options.action?.onClick();
            manager.close(id);
          },
        }
      : undefined,
  });
  return id;
}

/** Fire a toast from anywhere, inside or outside React. Mutations toast on success and on failure. */
export const toast = {
  info: (title: string, options?: ToastOptions) => push("info", title, options),
  success: (title: string, options?: ToastOptions) => push("success", title, options),
  error: (title: string, options?: ToastOptions) => push("error", title, options),
};

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const TINT = { success: "text-success", error: "text-danger", info: "text-accent-gold-text" } as const;

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return toasts.map((t) => {
    const type = (t.type === "success" || t.type === "error" ? t.type : "info") as keyof typeof ICON;
    const Icon = ICON[type];
    return (
      <Toast.Root
        key={t.id}
        toast={t}
        className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-border bg-surface-raised p-4 text-text shadow-overlay transition-[transform,opacity] duration-(--duration-slow) ease-(--ease-out) data-[starting-style]:-translate-y-3 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0"
      >
        <Icon className={`mt-0.5 size-5 shrink-0 ${TINT[type]}`} aria-hidden />
        <Toast.Content className="grid min-w-0 flex-1 gap-0.5">
          <Toast.Title className="font-semibold" />
          <Toast.Description className="text-label text-text-muted" />
        </Toast.Content>
        <Toast.Action className="min-h-11 shrink-0 rounded-pill px-3 font-semibold text-primary outline-none hover:bg-primary-soft" />
        <Toast.Close aria-label="Dismiss" className="grid size-11 shrink-0 place-items-center rounded-pill outline-none hover:bg-primary-soft">
          <X className="size-4" aria-hidden />
        </Toast.Close>
      </Toast.Root>
    );
  });
}

export function Toaster() {
  return (
    <Toast.Provider toastManager={manager} limit={4}>
      <Toast.Viewport className="host-app pointer-events-none fixed inset-x-0 top-[calc(var(--header-h)+0.5rem)] z-[60] mx-auto grid w-[min(100%-1.5rem,26rem)] gap-2 bg-transparent">
        <ToastList />
      </Toast.Viewport>
    </Toast.Provider>
  );
}
