import { type CardView } from "@invite-me/api/invites/card";
import { parseLinkToken } from "@invite-me/api/invites/token";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";

import { couplePhotoUrl } from "@/components/couple-photo-field";
import { toast } from "@/components/toaster";
import { GoldenCallerCard } from "@/presets/traditional-golden-caller/card";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/i/$clientId/$token")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: GuestInvite,
});

type LinkInput = { clientId: string; partyId: string; secret: string };

function GuestInvite() {
  const { clientId, token } = Route.useParams();
  const link = parseLinkToken(token);

  if (!link) return <Closed />;
  return <GuestLoader input={{ clientId, partyId: link.id, secret: link.secret }} />;
}

function GuestLoader({ input }: { input: LinkInput }) {
  const invite = useQuery(orpc.invite.resolve.queryOptions({ input }));

  if (invite.isPending) return <p className="p-6 text-center text-sm">Loading invitation…</p>;
  if (!invite.data || invite.data.state === "closed") return <Closed />;

  return <Open input={input} party={invite.data.party} card={invite.data.card} />;
}

type GuestParty = {
  displayName: string;
  seats: number;
  seatLabel: string | null;
  rules: string | null;
  rsvp: string;
};

function Open({ input, party, card }: { input: LinkInput; party: GuestParty; card: CardView }) {
  const recordOpen = useMutation(orpc.invite.recordOpen.mutationOptions());
  const counted = useRef(false);

  // Called on mount of the card element. One open per page view, and only once the card is on screen.
  function onCardMounted(el: HTMLDivElement | null) {
    if (!el || counted.current) return;
    counted.current = true;
    recordOpen.mutate(input);
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-3 py-4 lg:max-w-none">
      <p className="mb-3 text-center text-sm text-muted-foreground">For {party.displayName}</p>
      <div ref={onCardMounted}>
        <GoldenCallerCard card={card} photoUrl={couplePhotoUrl(card.couplePhotoKey)} />
      </div>
      <Rsvp input={input} seats={party.seats} seatLabel={party.seatLabel} current={party.rsvp} />
      {card.rules ? <p className="mt-4 text-sm whitespace-pre-line">{card.rules}</p> : null}
      {party.rules ? <p className="mt-2 text-sm whitespace-pre-line">{party.rules}</p> : null}
    </main>
  );
}

function Rsvp({
  input,
  seats,
  seatLabel,
  current,
}: {
  input: LinkInput;
  seats: number;
  seatLabel: string | null;
  current: string;
}) {
  const [headCount, setHeadCount] = useState(seats);
  const rsvp = useMutation(
    orpc.invite.rsvp.mutationOptions({
      onSuccess: () => toast.success("Thank you, your response is recorded"),
      onError: (error) => toast.error("Could not record response", { description: error.message }),
    }),
  );

  return (
    <section className="mt-6 grid gap-3 rounded-lg border p-4">
      <p className="text-sm font-medium">
        Will you attend? {current !== "pending" ? `(now: ${current})` : ""}
      </p>
      <label className="grid gap-1 text-sm">
        {seatLabel ?? "Number attending"}
        <input
          type="number"
          min={1}
          max={seats}
          className="rounded-md border bg-background px-3 py-2"
          value={headCount}
          onChange={(e) => setHeadCount(Number(e.target.value))}
        />
      </label>
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-2"
          onClick={() => rsvp.mutate({ ...input, status: "yes", headCount })}
        >
          Yes
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2"
          onClick={() => rsvp.mutate({ ...input, status: "maybe" })}
        >
          Maybe
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2"
          onClick={() => rsvp.mutate({ ...input, status: "no" })}
        >
          No
        </button>
      </div>
    </section>
  );
}

function Closed() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <p className="text-sm text-muted-foreground">This invitation is not available.</p>
    </main>
  );
}
