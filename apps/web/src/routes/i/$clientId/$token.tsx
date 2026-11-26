import type { Card as CardData, PresetId } from "@invite-me/api/invites/card";
import { parseLinkToken } from "@invite-me/api/invites/token";
import { GuestSkeleton } from "@/components/skeletons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { toast } from "@/components/toaster";
import { PRESETS, presetFor } from "@/presets";
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

  // A guest may view the card in another design. It is their own choice, kept in this browser only.
  const key = `invite.design.${input.partyId}`;
  const [mine, setMine] = useState<{ preset: string; look: Record<string, string> } | null>(null);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setMine(JSON.parse(saved));
    } catch {
      // no saved choice
    }
  }, [key]);
  function choose(next: { preset: string; look: Record<string, string> } | null) {
    setMine(next);
    try {
      if (next) localStorage.setItem(key, JSON.stringify(next));
      else localStorage.removeItem(key);
    } catch {
      // storage is off; the choice lasts until the page closes
    }
  }
  const allowed = card.allowGuestDesign !== false;
  const shownPreset = (allowed && mine?.preset && mine.preset in PRESETS ? mine.preset : card.preset) as PresetId;
  const shownLook = allowed && mine && shownPreset === mine.preset ? mine.look : card.look;
  const shown = presetFor(shownPreset);
  const { GuestPage } = shown;
  return (
    <GuestPage
      card={{ ...card, preset: shownPreset, look: shownLook }}
      design={
        allowed
          ? {
              current: shownPreset,
              options: (Object.keys(PRESETS) as PresetId[]).map((id) => ({ id, name: PRESETS[id].name })),
              look: shownLook,
              lookOptions: shown.lookOptions,
              onPick: (id) => choose({ preset: id, look: id === card.preset ? card.look : {} }),
              onLook: (k, v) => choose({ preset: shownPreset, look: { ...shownLook, [k]: v } }),
              onReset: () => choose(null),
            }
          : undefined
      }
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
