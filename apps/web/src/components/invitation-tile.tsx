import type { Card, PresetId } from "@invite-me/api/invites/card";
import {
  Card as UiCard,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@invite-me/ui/components/motion/card";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Copy, MailOpen, MoreHorizontal, Pencil, Printer, Send, Settings2, TriangleAlert, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { InvitationCard, invitationDate, invitationTitle } from "@/components/invitation-card";
import { TemplatePicker } from "@/components/new-invitation-dialog";
import { ListSkeleton } from "@/components/skeletons";
import { toast } from "@/components/toaster";
import {
  AlertDialog,
  AlertDialogContent,
  Badge,
  buttonStyles,
  Button,
  EmptyState,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PageHeader,
} from "@/components/ui";
import { orpc } from "@/utils/orpc";

type Invitation = { id: string; card: Card };

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/** "Beach Resort, Weligama": only the parts that exist, joined with a comma and no stray space. */
function venueLine(card: Card) {
  return [card.venueName, card.city]
    .map((part) => titleCase(part.trim()))
    .filter(Boolean)
    .join(", ");
}

/** Creates an invitation from a design, then opens it for editing. */
export function useCreateInvitation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return useMutation(
    orpc.invitations.create.mutationOptions({
      onSuccess: async (inv) => {
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        toast.success("Invitation created");
        await navigate({ to: "/invitations/$id/edit", params: { id: inv.id } });
      },
      onError: (error) => toast.error("Could not create the invitation", { description: error.message }),
    }),
  );
}

/**
 * What the host sees at a glance, worked out from the guest list:
 * no guests = Draft, guests but no replies = Shared, at least one reply = Replies in.
 */
function useSummary(eventId: string) {
  const parties = useQuery(orpc.parties.list.queryOptions({ input: { eventId } }));
  if (!parties.data) return { loading: !parties.isError, total: 0, replied: 0 };
  const active = parties.data.filter((p) => p.status !== "revoked");
  return { loading: false, total: active.length, replied: active.filter((p) => p.status === "responded").length };
}

function StatusBadge({ loading, total, replied }: { loading: boolean; total: number; replied: number }) {
  if (loading) return null;
  if (total === 0) return <Badge tone="neutral" icon={Pencil}>Draft</Badge>;
  if (replied === 0) return <Badge tone="info" icon={Send}>Shared</Badge>;
  return <Badge tone="success" icon={CheckCircle2}>Replies in</Badge>;
}

export function InvitationTile({ invitation }: { invitation: Invitation }) {
  const { id, card } = invitation;
  const queryClient = useQueryClient();
  const summary = useSummary(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const title = invitationTitle(card);
  const venue = venueLine(card);

  const remove = useMutation(
    orpc.invitations.remove.mutationOptions({
      onSuccess: async () => {
        setConfirmDelete(false);
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        toast.success("Invitation deleted");
      },
      onError: (error) => toast.error("Could not delete the invitation", { description: error.message }),
    }),
  );

  const create = useMutation(orpc.invitations.create.mutationOptions());
  const save = useMutation(orpc.invitations.save.mutationOptions());
  const undo = useMutation(
    orpc.invitations.remove.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
        toast.info("Copy removed");
      },
      onError: (error) => toast.error("Could not remove the copy", { description: error.message }),
    }),
  );
  const duplicating = create.isPending || save.isPending;

  async function duplicate() {
    try {
      const copy = await create.mutateAsync({ preset: card.preset as PresetId });
      await save.mutateAsync({ id: copy.id, card: { ...card } });
      await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
      toast.success("Invitation duplicated", {
        description: title,
        action: { label: "Undo", onClick: () => undo.mutate({ id: copy.id }) },
      });
    } catch (error) {
      await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
      toast.error("Could not duplicate the invitation", { description: error instanceof Error ? error.message : undefined });
    }
  }

  return (
    <li className="flex">
      <UiCard
        size="compact"
        className="w-full gap-0 rounded-3xl bg-surface-raised p-0 transition-[border-color,box-shadow] duration-(--duration-base) hover:border-border-strong hover:shadow-overlay"
      >
        <div className="relative p-3">
          <Link
            to="/invitations/$id"
            params={{ id }}
            aria-label={`Open ${title}`}
            className="block overflow-hidden rounded-2xl outline-offset-4"
          >
            <InvitationCard card={card} className="mx-auto max-w-60 rounded-2xl sm:max-w-none" />
          </Link>

          <Menu>
            <MenuTrigger
              render={
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="More actions"
                  className="absolute right-5 top-5 bg-surface-raised/95 shadow-overlay"
                  disabled={duplicating}
                />
              }
            >
              <MoreHorizontal className="size-5" aria-hidden />
            </MenuTrigger>
            <MenuContent>
              <MenuItem render={<Link to="/invitations/$id/print" params={{ id }} />}>
                <Printer className="size-5" aria-hidden />
                Print or PDF
              </MenuItem>
              <MenuItem onClick={() => void duplicate()}>
                <Copy className="size-5" aria-hidden />
                Duplicate
              </MenuItem>
              <MenuSeparator />
              <MenuItem danger onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-5" aria-hidden />
                Delete
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>

        <CardHeader className="gap-1 px-4 pb-3">
          <CardTitle as="h2" className="font-display text-section font-[450] text-text">
            {title}
          </CardTitle>
          <CardDescription className="text-label text-text-muted">
            {invitationDate(card)}
            {venue ? ` · ${venue}` : ""}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 pb-4 text-label">
          <StatusBadge {...summary} />
          <span className="flex items-center gap-1.5 text-label text-text-muted">
            <Users className="size-4 shrink-0" aria-hidden />
            {summary.loading ? "Counting replies…" : summary.total === 0 ? "No guests yet" : `${summary.replied} of ${summary.total} replied`}
          </span>
        </CardContent>

        <CardFooter className="mt-auto px-4 pb-4">
          <Link
            to="/invitations/$id"
            params={{ id }}
            className={buttonStyles({ variant: "secondary", className: "w-full" })}
          >
            <Settings2 className="size-5" aria-hidden />
            Configuration
          </Link>
        </CardFooter>
      </UiCard>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent
          title="Delete this invitation?"
          description={`${title} and its guest list will be removed for good. Links you already shared will stop working.`}
          confirmLabel="Delete invitation"
          loading={remove.isPending}
          onConfirm={() => remove.mutate({ id })}
        />
      </AlertDialog>
    </li>
  );
}

/** Starts the first invitation: every design, one tap to use it. */
function FirstInvitation() {
  const [picked, setPicked] = useState<PresetId | null>(null);
  const create = useCreateInvitation();
  return (
    <section aria-label="Choose a design" className="grid gap-5">
      <EmptyState
        icon={MailOpen}
        title="Make your first invitation"
        description="Pick a design. You can change every word on it afterwards."
        className="border-solid bg-surface"
      />
      <TemplatePicker value={picked} onChange={setPicked} />
      <div>
        <Button size="lg" disabled={!picked} loading={create.isPending} onClick={() => picked && create.mutate({ preset: picked })}>
          Use this design
        </Button>
      </div>
    </section>
  );
}

/** The signed-in list screen, shared by Home and Invitations. */
export function InvitationList({ title }: { title: string }) {
  const list = useQuery(orpc.invitations.list.queryOptions());
  const empty = list.data?.length === 0;
  return (
    <>
      <PageHeader title={title} description="Every card you have made. Open Configure to manage its guests and settings." />
      {list.isError ? (
        <EmptyState
          icon={TriangleAlert}
          title="We could not load your invitations"
          description="Check your connection and try again."
          action={<Button onClick={() => void list.refetch()} loading={list.isFetching}>Try again</Button>}
        />
      ) : !list.data ? (
        <ListSkeleton />
      ) : empty ? (
        <FirstInvitation />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.data.map((inv) => (
            <InvitationTile key={inv.id} invitation={inv} />
          ))}
        </ul>
      )}
    </>
  );
}
