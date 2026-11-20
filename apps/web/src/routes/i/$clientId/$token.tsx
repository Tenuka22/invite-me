import { type Card } from "@invite-me/api/invites/card";
import { parseLinkToken } from "@invite-me/api/invites/token";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@invite-me/ui/components/motion/dialog";
import { Check, Heart, Minus, Plus } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { GuestInviteSkeleton } from "@/components/page-skeletons";
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

  if (invite.isPending) return <GuestInviteSkeleton />;
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

function Open({ input, party, card }: { input: LinkInput; party: GuestParty; card: Card }) {
  const recordOpen = useMutation(orpc.invite.recordOpen.mutationOptions());
  const counted = useRef(false);

  // A guest often has many tabs open; name this one after the invitee.
  useEffect(() => {
    const previous = document.title;
    document.title = `You're invited — ${party.displayName}`;
    return () => {
      document.title = previous;
    };
  }, [party.displayName]);

  // Called on mount of the card element. One open per page view, and only once the card is on screen.
  function onCardMounted(el: HTMLDivElement | null) {
    if (!el || counted.current) return;
    counted.current = true;
    recordOpen.mutate(input);
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full flex-col justify-center px-3 pt-4 pb-28 md:grid md:max-w-4xl md:grid-cols-[min(25rem,calc((100svh-10rem)*0.706))_20rem] md:content-center md:justify-center md:items-center md:gap-16 md:px-8 md:py-12">
      {/* Eyebrow above the hero card: names the invitee early, so the card's own
          display line is the focus. Card is capped so the whole card fits the viewport. */}
      <div className="mx-auto w-full md:mx-0">
        <h1 className="mb-3 text-center text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80 md:text-left">
          You're invited — {party.displayName}
        </h1>
        <div ref={onCardMounted} className="mx-auto w-full md:mx-0">
          <GoldenCallerCard
            card={card}
            maxWidth="min(100%, 400px, calc((100svh - 10rem) * 0.706))"
          />
        </div>
      </div>
      <div className="mx-auto mt-6 grid w-full max-w-md gap-6 md:mx-0 md:mt-0 md:max-w-none">
        {party.rules ? (
          <div className="rounded-xl border border-border bg-card/60 px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-foreground/80">
              Good to know
            </span>
            {party.rules}
          </div>
        ) : null}
        <Rsvp input={input} seats={party.seats} seatLabel={party.seatLabel} current={party.rsvp} />
      </div>
    </main>
  );
}

const REPLY_LABEL: Record<string, string> = {
  yes: "You're coming",
  maybe: "Maybe",
  no: "Can't make it",
};

/** A floating "Will you attend?" button; the answer is chosen in a sheet and then shown on the button. */
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
  const [status, setStatus] = useState(current);
  const [headCount, setHeadCount] = useState(seats);
  const [open, setOpen] = useState(false);
  const rsvp = useMutation(
    orpc.invite.rsvp.mutationOptions({
      onSuccess: (_result, sent) => {
        setStatus(sent.status);
        setOpen(false);
        toast.success("Thank you, your response is recorded");
      },
      onError: (error) => toast.error("Could not record response", { description: error.message }),
    }),
  );
  const answered = status !== "pending";

  return (
    <>
      {/* Fixed on phones so it floats over the card; inline in the right column on desktop. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:p-0">
        <Button
          size="lg"
          variant={answered ? "secondary" : "primary"}
          className="pointer-events-auto h-14 w-full gap-3 text-lg shadow-[0_12px_32px_-8px_oklch(0.26_0.035_40/0.45)] max-md:max-w-sm"
          onClick={() => setOpen(true)}
        >
          {answered ? (
            <>
              <Check className="size-5 text-primary" aria-hidden />
              {REPLY_LABEL[status] ?? status}
              <span className="text-muted-foreground">· Change</span>
            </>
          ) : (
            <>
              <Heart className="size-5" aria-hidden />
              Will you attend?
            </>
          )}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="grid gap-6">
            <div>
              <DialogTitle className="font-display text-3xl tracking-[-0.02em]">Will you attend?</DialogTitle>
              <DialogDescription className="mt-1 text-base text-muted-foreground">
                Let the hosts know. You can change your answer later.
              </DialogDescription>
            </div>

            {seats > 1 ? (
              <div className="flex items-center justify-between gap-4">
                <span className="text-base font-medium">{seatLabel ?? "Number attending"}</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="size-12 p-0"
                    aria-label="One fewer"
                    disabled={headCount <= 1}
                    onClick={() => setHeadCount((n) => n - 1)}
                  >
                    <Minus className="size-5" aria-hidden />
                  </Button>
                  <span className="w-8 text-center text-xl font-semibold tabular-nums" aria-live="polite">
                    {headCount}
                  </span>
                  <Button
                    variant="outline"
                    className="size-12 p-0"
                    aria-label="One more"
                    disabled={headCount >= seats}
                    onClick={() => setHeadCount((n) => n + 1)}
                  >
                    <Plus className="size-5" aria-hidden />
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3">
              <Button
                size="lg"
                className="h-14 text-lg"
                disabled={rsvp.isPending}
                onClick={() => rsvp.mutate({ ...input, status: "yes", headCount })}
              >
                Yes, I'll be there
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 text-lg"
                  disabled={rsvp.isPending}
                  onClick={() => rsvp.mutate({ ...input, status: "maybe" })}
                >
                  Maybe
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 text-lg"
                  disabled={rsvp.isPending}
                  onClick={() => rsvp.mutate({ ...input, status: "no" })}
                >
                  Can't make it
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Closed() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <p className="text-sm text-muted-foreground">This invitation is not available.</p>
    </main>
  );
}
