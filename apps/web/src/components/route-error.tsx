import { Alert, AlertContent, AlertDescription, AlertTitle } from "@invite-me/ui/components/motion/alert";
import { Button } from "@invite-me/ui/components/motion/button/base";

/** Route-level error boundary body: plain-language message plus a retry. */
export function RouteError({ error, reset }: { error: unknown; reset: () => void }) {
  return (
    <main className="host-app grid min-h-svh place-items-center p-6">
      <div className="flex w-full max-w-md flex-col items-start gap-4">
        <Alert variant="destructive">
          <AlertContent>
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error instanceof Error && error.message ? error.message : "Please try again."}</AlertDescription>
          </AlertContent>
        </Alert>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
