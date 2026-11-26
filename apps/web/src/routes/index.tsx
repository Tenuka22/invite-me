import { ButtonLink } from "@invite-me/ui/components/motion/button/base";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import type { PresetId } from "@invite-me/api/invites/card";

import { HostShell } from "@/components/host-shell";
import { InvitationCard } from "@/components/invitation-card";
import { HomeSkeleton } from "@/components/skeletons";
import { TemplateModal } from "@/components/template-modal";
import { getSession } from "@/lib/auth-client";
import { PRESETS, presetFor } from "@/presets";
import { sampleCard } from "@/presets/sample";
import { orpc } from "@/utils/orpc";

/** The designs are bundled with the app, so listing them needs no request. */
const TEMPLATES = (Object.keys(PRESETS) as PresetId[]).map((preset) => ({ preset, card: sampleCard(preset) }));

export const Route = createFileRoute("/")({
  component: HomePage,
  pendingComponent: () => (
    <HostShell>
      <HomeSkeleton />
    </HostShell>
  ),
  ssr: false,
  beforeLoad: async () => {
    const session = await getSession();
    if (!session.data) throw redirect({ to: "/login" });
  },
});

function HomePage() {

  const list = useQuery(orpc.invitations.list.queryOptions());
  const [picked, setPicked] = useState<PresetId | null>(null);
  if (!list.data) {
    return (
      <HostShell>
        <HomeSkeleton />
      </HostShell>
    );
  }
  return (
    <HostShell>
      <h1 className="text-5xl sm:text-6xl">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">Start from one of our templates.</p>

      <section aria-labelledby="templates" className="mt-10">
        <h2 id="templates" className="mb-4 text-2xl">
          Templates
        </h2>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {TEMPLATES.map(({ preset, card }) => {
            const { Thumb, name } = presetFor(preset);
            return (
              <li key={preset}>
                <button type="button" onClick={() => setPicked(preset)} className="group grid w-full gap-3 text-left">
                  <div className="overflow-hidden rounded-2xl shadow-[0_12px_28px_-14px_rgb(60_30_10/0.45)] transition-transform duration-300 group-hover:-translate-y-1 group-active:scale-[0.99]">
                    <Thumb card={card} />
                  </div>
                  <p className="font-[Fraunces_Variable,Fraunces,Georgia,serif] text-xl leading-tight">{name}</p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      <TemplateModal preset={picked} onClose={() => setPicked(null)} />

      <section aria-labelledby="mine" className="mt-14">
        <h2 id="mine" className="mb-4 text-2xl">
          Your invitations
        </h2>
        {list.data?.length === 0 ? (
          <div className="grid justify-items-start gap-3">
            <p className="text-muted-foreground">Nothing here yet. Pick a template above to begin.</p>
            <ButtonLink href="/invitations/new">New invitation</ButtonLink>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {list.data?.map((inv) => (
              <li key={inv.id}>
                <InvitationCard id={inv.id} card={inv.card} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </HostShell>
  );
}
