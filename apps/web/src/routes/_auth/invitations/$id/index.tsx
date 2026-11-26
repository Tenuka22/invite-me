import { Button } from "@invite-me/ui/components/motion/button/base";
import { StatefulButton } from "@invite-me/ui/components/motion/button/stateful";
import { Card, CardContent } from "@invite-me/ui/components/motion/card";
import { WorkspaceSkeleton } from "@/components/skeletons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Pencil, UserPlus } from "lucide-react";
import { useRef, useState } from "react";

import { AddGuestForm, GuestList } from "@/components/guest-manager";
import { HostMeter } from "@/components/host-meter";
import { PageTitle } from "@/components/host-shell";
import { invitationDate, invitationTitle } from "@/components/invitation-card";
import { toast } from "@/components/toaster";
import { presetFor } from "@/presets";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/")({
  component: InvitationPage,
});

function InvitationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  const [adding, setAdding] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const remove = useMutation(
    orpc.invitations.remove.mutationOptions({
      onSuccess: async () => {
        toast.success("Invitation deleted");
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        await navigate({ to: "/invitations" });
      },
      onError: (error) => toast.error("Could not delete", { description: error.message }),
    }),
  );

  if (!invitation.data) {
    return (
      <WorkspaceSkeleton />
    );
  }
  const { card } = invitation.data;
  const { Thumb } = presetFor(card.preset);

  function openAdd() {
    setAdding(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div>
      <PageTitle back={{ to: "/invitations" }} title={invitationTitle(card)} />
      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-12">
        <div className="mx-auto w-full max-w-[15rem] overflow-hidden rounded-2xl shadow-[0_16px_34px_-16px_rgb(60_30_10/0.5)] md:mx-0">
          <Thumb card={card} />
        </div>

        <div className="grid gap-8">
          <div className="grid gap-4">
            <div>
              <h2 className="text-3xl">{invitationDate(card)}</h2>
              <p className="text-muted-foreground">
                {card.venueName.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())},{" "}
                {card.city.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="btn-xl" onClick={() => navigate({ to: "/invitations/$id/edit", params: { id } })}>
                <Pencil className="size-5" aria-hidden /> Edit card
              </Button>
              <Button size="lg" variant="outline" className="btn-xl btn-xl-outline" onClick={openAdd}>
                <UserPlus className="size-5" aria-hidden /> Add guest
              </Button>
            </div>
          </div>

          <section aria-labelledby="replies">
            <h2 id="replies" className="mb-3 text-2xl">
              Replies
            </h2>
            <HostMeter eventId={id} />
          </section>

          {adding ? (
            <div ref={formRef} className="scroll-mt-6">
              <AddGuestForm eventId={id} onDone={() => setAdding(false)} />
            </div>
          ) : null}

          <section aria-labelledby="guests">
            <h2 id="guests" className="mb-3 text-2xl">
              Guests
            </h2>
            <GuestList eventId={id} onAddFirst={openAdd} />
          </section>

          <Card variant="muted" size="compact">
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Deleting removes this invitation and all its guest links.</p>
              <StatefulButton
                size="sm"
                variant={confirmDelete ? "primary" : "outline"}
                state={remove.isPending ? "loading" : "idle"}
                loadingText="Deleting"
                onBlur={() => setConfirmDelete(false)}
                onClick={() => (confirmDelete ? remove.mutate({ id }) : setConfirmDelete(true))}
              >
                {confirmDelete ? "Confirm delete" : "Delete invitation"}
              </StatefulButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
