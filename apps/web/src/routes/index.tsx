import { DEFAULT_CARD } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";

import { CardThumb } from "@/components/card-thumb";

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
  const signIn = () => navigate({ to: "/login", search: { next: "/" } });
  const steps = [
    { title: "Design the card", body: "Add the names, date and venue, then pick a template." },
    { title: "Share with each guest", body: "Every guest gets their own link to their own card." },
    { title: "Guests RSVP", body: "They open the card and confirm. You see who is coming." },
  ];

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-6">
      <header className="flex h-20 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="size-7" />
          <span className="font-display text-lg tracking-[-0.02em]">Invite Me</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signIn}>
          Sign in
        </Button>
      </header>

      <main className="grid flex-1 content-center gap-12 py-12 md:grid-cols-[minmax(0,1fr)_minmax(0,300px)] md:items-center md:gap-16 md:py-20">
        <section className="grid gap-8">
          <div className="grid gap-5">
            <h1 className="font-display text-5xl leading-[1.05] tracking-[-0.03em] text-balance md:text-6xl">
              Invitations that feel like the celebration.
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Create one card per event, send each guest their own link, and collect RSVPs in one place.
            </p>
          </div>
          <div>
            <Button variant="primary" size="sm" onClick={signIn}>
              Sign in to start
            </Button>
          </div>
        </section>
        <div className="mx-auto w-full max-w-[280px] md:max-w-none">
          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-foreground/10">
            <CardThumb card={DEFAULT_CARD} />
          </div>
        </div>
      </main>

      <section aria-labelledby="how-heading" className="grid gap-8 border-t border-border py-12">
        <h2 id="how-heading" className="font-display text-2xl tracking-[-0.02em]">
          How it works
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="grid content-start gap-2">
              <span className="font-display text-sm text-primary">0{i + 1}</span>
              <h3 className="font-medium">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Workspace() {
  const templates = useQuery(orpc.invitations.templates.queryOptions());

  return (
    <main className="mx-auto w-full max-w-5xl px-6 pt-8 md:pt-12">
      <h1 className="font-display text-4xl tracking-[-0.03em] md:text-5xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Start from one of our templates.</p>

      <section className="mt-10" aria-labelledby="templates-heading">
        <h2 id="templates-heading" className="font-display text-2xl tracking-[-0.02em]">
          Templates
        </h2>
        {templates.isPending ? (
          <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
            <Skeleton className="aspect-[1075/1523] w-full rounded-lg" />
            <Skeleton className="aspect-[1075/1523] w-full rounded-lg" />
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {templates.data?.map((template) => (
              <li key={template.id}>
                <Link
                  to="/invitations/new"
                  className="group block rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-foreground/10 transition-transform duration-200 group-hover:-translate-y-1">
                    <CardThumb card={DEFAULT_CARD} />
                  </div>
                  <p className="mt-4 font-display text-xl leading-tight tracking-[-0.02em]">{template.name}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link to="/invitations" className="mt-10 inline-block text-sm font-medium text-primary hover:underline">
        Your invitations
      </Link>
    </main>
  );
}
