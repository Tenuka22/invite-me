import { Button } from "@invite-me/ui/components/motion/button/base";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand";
import { LoginSkeleton, Skeleton } from "@/components/skeletons";
import { toast } from "@/components/toaster";
import { ENV } from "@/env.public";
import { authClient, getSession } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Sign in · Invite Me" }] }),
  validateSearch: (search: Record<string, unknown>): { next?: string } => ({
    next:
      typeof search.next === "string" && search.next.startsWith("/") && !search.next.startsWith("//")
        ? search.next
        : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const { data } = await getSession();
    if (data?.session) throw redirect({ href: search.next ?? "/invitations" });
  },
  component: LoginPage,
  pendingComponent: LoginSkeleton,
  pendingMs: 0,
  pendingMinMs: 250,
});

type Provider = "google" | "github";
type Methods = Record<Provider, boolean>;

const PROVIDER_NAME: Record<Provider, string> = { google: "Google", github: "GitHub" };

/** Ask the server which providers have credentials. If it can't be reached, offer none rather than a button that fails. */
async function fetchMethods(): Promise<Methods> {
  try {
    const response = await fetch(`${ENV.VITE_SERVER_URL.replace(/\/$/, "")}/api/methods`);
    if (!response.ok) throw new Error("methods unavailable");
    return (await response.json()) as Methods;
  } catch {
    return { google: false, github: false };
  }
}

function LoginPage() {
  const { next: returnTo = "/invitations" } = Route.useSearch();
  const [methods, setMethods] = useState<Methods | null>(null);
  useEffect(() => {
    void fetchMethods().then(setMethods);
  }, []);
  const [busy, setBusy] = useState<Provider>();
  const available = (Object.keys(PROVIDER_NAME) as Provider[]).filter((provider) => methods?.[provider]);

  async function signIn(provider: Provider) {
    setBusy(provider);
    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: `${window.location.origin}${returnTo}`,
    });
    // On success the browser is already leaving for the provider.
    if (error) {
      setBusy(undefined);
      toast.error(`Could not sign in with ${PROVIDER_NAME[provider]}`, { description: error.message });
    }
  }

  return (
    <main className="host-app grid min-h-svh place-items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <span className="flex items-center">
          <BrandMark className="size-9" />
          <span className="sr-only">Invite Me</span>
        </span>

        <h1 className="mt-8 text-5xl">Sign in</h1>
        <p className="mt-3 text-pretty text-lg text-muted-foreground">
          Use your Google or GitHub account. We never see your password.
        </p>

        <div className="mt-8 grid gap-3">
          {methods === null ? <Skeleton className="h-14 w-full rounded-full" /> : null}
          {available.map((provider) => (
            <Button
              key={provider}
              variant="outline"
              size="lg"
              className="btn-xl btn-xl-outline w-full"
              disabled={busy !== undefined}
              onClick={() => void signIn(provider)}
            >
              {provider === "google" ? (
                <GoogleMark aria-hidden className="size-5" />
              ) : (
                <GitHubMark aria-hidden className="size-5" />
              )}
              {busy === provider ? "Opening…" : `Continue with ${PROVIDER_NAME[provider]}`}
            </Button>
          ))}
        </div>

        {methods && available.length === 0 ? (
          <p role="status" className="mt-2 text-base text-muted-foreground">
            Sign-in isn't set up on this server yet.
          </p>
        ) : null}
      </div>
    </main>
  );
}

function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.63h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.17-2 3.44-4.95 3.44-8.56Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.62-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.9 1.1-3 0-5.54-2.03-6.44-4.75H1.7v2.98A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.56 14.67a7.2 7.2 0 0 1 0-4.6V7.09H1.7a12 12 0 0 0 0 10.56l3.86-2.98Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.69 0 3.2.58 4.4 1.72l3.3-3.3C17.7 1.24 15.1 0 12 0 7.35 0 3.32 2.67 1.7 7.09l3.86 2.98C6.46 7.3 9 4.77 12 4.77Z"
      />
    </svg>
  );
}
