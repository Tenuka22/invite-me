import { Link } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";

import { Button, EmptyState, buttonStyles } from "@/components/ui";

/** A request that never reached the server reads as jargon; say what the visitor can do instead. */
function friendly(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (error instanceof TypeError || /fetch|network|connection/i.test(message)) {
    return "We can't reach the server. Check your connection, then try again.";
  }
  return message || "Please try again.";
}

/** Route-level error boundary body: plain-language message plus a way out. */
export function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <main className="host-app grid min-h-svh place-items-center p-6">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={friendly(error)}
        className="w-full max-w-md"
        action={
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" size="lg" onClick={reset}>
              Try again
            </Button>
            <Link to="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
              Go home
            </Link>
          </div>
        }
      />
    </main>
  );
}
