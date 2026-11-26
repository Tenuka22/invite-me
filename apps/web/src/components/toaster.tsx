import {
  AnimatedToastStack,
  type AnimatedToastAction,
  type ToastInput,
  type ToastStatus,
  useAnimatedToastStack,
} from "@invite-me/ui/components/motion/animated-toast-stack";
import { useEffect } from "react";

type ToastOptions = {
  description?: string;
  action?: AnimatedToastAction;
};

let emit: ((input: ToastInput) => void) | null = null;
const pending: ToastInput[] = [];

function push(status: ToastStatus, title: string, options?: ToastOptions) {
  const input: ToastInput = { status, title, ...options };
  if (emit) {
    emit(input);
  } else {
    pending.push(input);
  }
}

export const toast = {
  info: (title: string, options?: ToastOptions) => push("info", title, options),
  success: (title: string, options?: ToastOptions) => push("success", title, options),
  error: (title: string, options?: ToastOptions) => push("error", title, options),
};

export function Toaster() {
  const { toasts, showToast, dismissToast } = useAnimatedToastStack({
    defaultDuration: 4200,
    limit: 5,
  });

  useEffect(() => {
    emit = showToast;
    for (const input of pending.splice(0)) {
      showToast(input);
    }
    return () => {
      emit = null;
    };
  }, [showToast]);

  return (
    <div className="host-app contents">
      <AnimatedToastStack
        toasts={toasts}
        onDismiss={dismissToast}
        position="top-right"
        placement="fixed"
        maxVisible={4}
      />
    </div>
  );
}
