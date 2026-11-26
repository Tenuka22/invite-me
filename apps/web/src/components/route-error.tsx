import { TriangleAlert } from "lucide-react";

import { Button, EmptyState } from "@/components/ui";

/** Route-level error boundary body: plain-language message plus a retry. */
export function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <main className="host-app grid min-h-svh place-items-center p-6">
      <EmptyState
        icon={TriangleAlert}
        title="Something went wrong"
        description={error instanceof Error && error.message ? error.message : "Please try again."}
        className="w-full max-w-md"
        action={
          <Button variant="primary" size="lg" onClick={reset}>
            Try again
          </Button>
        }
      />
    </main>
  );
}
