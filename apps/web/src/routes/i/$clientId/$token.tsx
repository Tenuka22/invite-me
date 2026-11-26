import type { Card as CardData } from "@invite-me/api/invites/card";
import { parseLinkToken } from "@invite-me/api/invites/token";
import { GuestSkeleton } from "@/components/skeletons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { toast } from "@/components/toaster";
import { presetFor } from "@/presets";
import type { GuestPartyView } from "@/presets/types";
import { orpc } from "@/utils/orpc";

type LinkInput = { clientId: string; partyId: string; secret: string };

// An invitation changes rarely and the guest is the only reader, so keep it fresh for minutes.
const INVITE_STALE_MS = 5 * 60 * 1000;

function inviteQuery(input: LinkInput) {
  return {
    ...orpc.invite.resolve.queryOptions({ input }),
    staleTime: INVITE_STALE_MS,
    refetchOnWindowFocus: false,
  };
}

function inputFrom(params: { clientId: string; token: string }): LinkInput | null {
  const link = parseLinkToken(params.token);
  return link ? { clientId: params.clientId, partyId: link.id, secret: link.secret } : null;
}

export const Route = createFileRoute("/i/$clientId/$token")({
  head: () => ({
    meta: [{ title: "You're invited" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  // Start the invitation request as soon as the router matches, before the component mounts.
  // Skipped on the server: that request would count against one shared IP rate limit.
  loader: async ({ params, context }) => {
    const input = inputFrom(params);
    if (!input || typeof window === "undefined") return;
    await context.queryClient.prefetchQuery(inviteQuery(input));
  },
  component: GuestInvite,
});

function GuestInvite() {
  const params = Route.useParams();
  const input = inputFrom(params);
  if (!input) return <Closed />;
  return <GuestLoader input={input} />;
}

function GuestLoader({ input }: { input: LinkInput }) {
  const invite = useQuery(inviteQuery(input));

  if (invite.isPending) {
    return (
      <GuestSkeleton />
    );
  }
  if (!invite.data || invite.data.state === "closed") return <Closed />;

  return <Open input={input} party={invite.data.party} card={invite.data.card} />;
}

function Open({ input, party, card }: { input: LinkInput; party: GuestPartyView & { rsvp: string }; card: CardData }) {
  const recordOpen = useMutation(orpc.invite.recordOpen.mutationOptions());
  const counted = useRef(false);
  const [answer, setAnswer] = useState(party.rsvp);
  const rsvp = useMutation(
    orpc.invite.rsvp.mutationOptions({
      onSuccess: (_data, vars) => {
        setAnswer(vars.status);
        toast.success("Thank you, your response is recorded");
      },
      onError: (error) => toast.error("Could not record response", { description: error.message }),
    }),
  );

  // One open per page view.
  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    recordOpen.mutate(input);
  }, [input, recordOpen]);

  const { GuestPage } = presetFor(card.preset);
  return (
    <GuestPage
      card={card}
      party={party}
      answer={answer}
      pending={rsvp.isPending ? rsvp.variables?.status : undefined}
      onAnswer={(status, headCount) =>
        rsvp.mutate(status === "yes" ? { ...input, status, headCount } : { ...input, status })
      }
    />
  );
}

function Closed() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <p className="text-sm text-muted-foreground">This invitation is not available.</p>
    </main>
  );
}
