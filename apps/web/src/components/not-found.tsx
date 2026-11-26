import { Link } from "@tanstack/react-router";
import { SearchX } from "lucide-react";

import { EmptyState, buttonStyles } from "@/components/ui";

/** Fallback for unknown URLs. */
export function NotFound({
  title = "This page doesn't exist",
  description = "The link may be old or mistyped. If you were sent an invitation, ask the host for a fresh link.",
  inline = false,
}: {
  title?: string;
  description?: string;
  /** Inside the host app frame: no full-screen height. */
  inline?: boolean;
} = {}) {
  return (
    <div className={`host-app grid place-items-center px-4 ${inline ? "py-10" : "min-h-svh py-10"}`}>
      <EmptyState
        icon={SearchX}
        title={title}
        description={description}
        className="w-full max-w-md"
        action={
          <Link to="/" className={buttonStyles({ variant: "primary", size: "lg" })}>
            Go home
          </Link>
        }
      />
    </div>
  );
}
