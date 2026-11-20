import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { InvitationGallery } from "@/components/invitation-gallery";

import { HostShell } from "@/components/host-header";
import { Logo } from "@/components/logo";
import { Skeleton } from "@/components/skeleton";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Invite Me" }] }),
  component: Home,
});

/** Two homes and no redirect: the workspace when signed in, the landing page when signed out. */
function Home() {
  const session = authClient.useSession();
  if (session.isPending) return <HomeSkeleton />;
  if (!session.data?.session) return <Landing />;
  return (
    <HostShell>
      <Workspace />
    </HostShell>
  );
}

function HomeSkeleton() {
  return (
    <main className="mx-auto grid w-full max-w-3xl gap-6 px-6 pt-12 md:pt-16" aria-busy="true">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-12 w-72 max-w-full" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </main>
  );
}

function Landing() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto grid min-h-svh w-full max-w-3xl content-center gap-10 px-6 py-16">
      <Logo className="size-8" />
      <div className="grid gap-5">
        <h1 className="font-display text-5xl leading-[1.05] tracking-[-0.03em] md:text-6xl">
          Invitations that feel like the celebration.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Design a card, add your guests, and share a link. Each guest opens their own card and can RSVP.
        </p>
      </div>
      <div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate({ to: "/login", search: { next: "/" } })}
        >
          Sign in to start
        </Button>
      </div>
    </main>
  );
}

function Workspace() {
  const invitations = useQuery(orpc.invitations.list.queryOptions());
  const recent = (invitations.data ?? []).slice(0, 3);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-8 md:pt-12">
      <h1 className="font-display text-4xl tracking-[-0.03em] md:text-5xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Pick up where you left off, or start something new.</p>

      {invitations.isPending ? (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          <Skeleton className="aspect-[1075/1523] w-full rounded-lg" />
          <Skeleton className="aspect-[1075/1523] w-full rounded-lg" />
        </div>
      ) : invitations.isError ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
          <p className="font-medium">We couldn't load your invitations.</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection, then try again.</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => invitations.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <section className="mt-10">
          <InvitationGallery items={recent} />
          {(invitations.data?.length ?? 0) > recent.length ? (
            <Link to="/invitations" className="mt-8 inline-block text-sm font-medium text-primary hover:underline">
              All {invitations.data?.length} invitations
            </Link>
          ) : null}
        </section>
      )}
    </main>
  );
}
