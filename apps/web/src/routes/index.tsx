import type { PresetId } from "@invite-me/api/invites/card";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@invite-me/ui/components/motion/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";

import { HostShell } from "@/components/host-shell";
import { InvitationCard } from "@/components/invitation-card";
import { useCreateInvitation } from "@/components/invitation-tile";
import { PageSkeleton } from "@/components/skeletons";
import { Button, PageHeader, buttonStyles } from "@/components/ui";
import { getSession } from "@/lib/auth-client";
import { PRESETS } from "@/presets";
import { SAMPLE_PARTY, sampleCard } from "@/presets/sample";

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
      />

      <section aria-label="Designs" className="grid gap-4">
        <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
          <h2 className="text-section">Designs</h2>
          <p className="text-label text-text-muted">{IDS.length} to choose from</p>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {designs.map(({ id, card }) => (
            <li key={id} className="flex">
              {/* No tile chrome: the artwork is the card, sitting straight on the page. */}
              <Card size="compact" className="w-full gap-0 rounded-3xl border-0 p-0">
                <div className="p-3">
                  <InvitationCard
                    card={card}
                    party={SAMPLE_PARTY}
                    className="mx-auto max-w-60 rounded-2xl shadow-raised sm:max-w-none"
                    label={`${PRESETS[id].name} preview`}
                  />
                </div>

                <CardHeader className="gap-1 px-4 pb-4">
                  <CardTitle as="h2" className="font-display text-section font-[450] text-text">
                    {PRESETS[id].name}
                  </CardTitle>
                  <CardDescription className="text-text-muted">{PRESETS[id].blurb}</CardDescription>
                </CardHeader>

                <CardFooter className="mt-auto px-4 pb-4">
                  {signedIn ? (
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      loading={create.isPending && create.variables?.preset === id}
                      disabled={create.isPending}
                      onClick={() => create.mutate({ preset: id })}
                    >
                      Use this design
                    </Button>
                  ) : (
                    <Link to="/login" className={buttonStyles({ variant: "primary", size: "md", className: "w-full" })}>
                      Use this design
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    </HostShell>
  );
}
