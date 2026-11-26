import type { PresetId } from "@invite-me/api/invites/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { HostShell } from "@/components/host-shell";
import { InvitationCard } from "@/components/invitation-card";
import { useCreateInvitation } from "@/components/invitation-tile";
import { PageSkeleton } from "@/components/skeletons";
import { Button, PageHeader, buttonStyles } from "@/components/ui";
import { getSession } from "@/lib/auth-client";
import { PRESETS } from "@/presets";
import { sampleCard } from "@/presets/sample";

export const Route = createFileRoute("/")({
  component: HomePage,
  pendingComponent: () => (
    <HostShell>
      <PageSkeleton />
    </HostShell>
  ),
  ssr: false,
  // Public page: anyone can look at every design. Only "Use this design" needs an account.
  beforeLoad: async () => {
    let signedIn = false;
    try {
      signedIn = Boolean((await getSession()).data);
    } catch {
      // The account service is unreachable: browse as a visitor.
    }
    return { signedIn };
  },
});

const IDS = Object.keys(PRESETS) as PresetId[];

/** Home is the showroom: your own invitations live on their own page. */
function HomePage() {
  const { signedIn } = Route.useRouteContext();
  const create = useCreateInvitation();
  const designs = useMemo(() => IDS.map((id) => ({ id, card: sampleCard(id) })), []);

  return (
    <HostShell signedIn={signedIn}>
      <PageHeader
        title="Pick a design"
        description="Four ways to say you're invited. Choose one, then make every word your own."
        actions={
          signedIn ? (
            <Link to="/invitations" className={buttonStyles({ variant: "secondary" })}>
              Your invitations
            </Link>
          ) : undefined
        }
      />
      <ul className="grid gap-6 lg:grid-cols-2">
        {designs.map(({ id, card }) => (
          <li
            key={id}
            className="group grid gap-5 rounded-3xl border border-border bg-surface-raised p-4 shadow-raised transition-[transform,box-shadow] duration-(--duration-base) ease-(--ease-out) hover:-translate-y-1 hover:shadow-overlay sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] sm:p-5"
          >
            <InvitationCard card={card} className="mx-auto max-w-72 rounded-2xl shadow-raised sm:max-w-none" label={`${PRESETS[id].name} preview`} />
            <div className="flex min-w-0 flex-col justify-end gap-5">
              <div className="grid gap-2">
                <h2 className="text-display">{PRESETS[id].name}</h2>
                <p className="text-text-muted">{PRESETS[id].blurb}</p>
              </div>
              {signedIn ? (
                <Button
                  variant="primary"
                  size="lg"
                  loading={create.isPending && create.variables?.preset === id}
                  disabled={create.isPending}
                  onClick={() => create.mutate({ preset: id })}
                >
                  Use this design
                </Button>
              ) : (
                <Link to="/login" className={buttonStyles({ variant: "primary", size: "lg" })}>
                  Use this design
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </HostShell>
  );
}
