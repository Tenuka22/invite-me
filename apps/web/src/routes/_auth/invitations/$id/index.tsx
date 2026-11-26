import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Copy, MoreHorizontal, Pencil, Printer, RotateCw, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";

import { AddGuestDialog } from "@/components/add-guest-dialog";
import { GuestList } from "@/components/guest-manager";
import { HostMeter } from "@/components/host-meter";
import { InvitationCard, invitationDate, invitationTitle } from "@/components/invitation-card";
import { NotFound } from "@/components/not-found";
import { PrintDialog } from "@/components/print-dialog";
import { toast } from "@/components/toaster";
import {
  AlertDialog,
  AlertDialogContent,
  BackLink,
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PageHeader,
  Skeleton,
  buttonStyles,
} from "@/components/ui";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/_auth/invitations/$id/")({
  component: InvitationPage,
});

function titleCase(text: string) {
  return text.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function InvitationPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const invitation = useQuery(orpc.invitations.get.queryOptions({ input: { id } }));
  const [adding, setAdding] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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
  const undoCopy = useMutation(
    orpc.invitations.remove.mutationOptions({
      onSuccess: async () => {
        toast.info("Copy removed");
        await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
      },
      onError: (error) => toast.error("Could not remove the copy", { description: error.message }),
    }),
  );
  const create = useMutation(orpc.invitations.create.mutationOptions());
  const save = useMutation(orpc.invitations.save.mutationOptions());
  const duplicating = create.isPending || save.isPending;

  async function duplicate() {
    if (!invitation.data) return;
    const { card } = invitation.data;
    try {
      const copy = await create.mutateAsync({ preset: card.preset });
      await save.mutateAsync({ id: copy.id, card });
      await queryClient.invalidateQueries({ queryKey: orpc.invitations.key() });
      toast.success("Invitation duplicated", {
        description: "Guests are not copied.",
        action: {
          label: "Undo",
          onClick: () => {
            undoCopy.mutate({ id: copy.id });
            void navigate({ to: "/invitations/$id", params: { id } });
          },
        },
      });
      await navigate({ to: "/invitations/$id", params: { id: copy.id } });
    } catch (error) {
      toast.error("Could not duplicate", { description: error instanceof Error ? error.message : undefined });
    }
  }

  if (invitation.isError) {
    if (invitation.error && "code" in invitation.error && invitation.error.code === "NOT_FOUND") {
      return <NotFound inline title="We can't find that invitation" description="It may have been deleted, or the link is wrong." />;
    }
    return (
      <div className="grid gap-4">
        <BackLink to="/invitations" label="Invitations" />
        <div className="rounded-2xl border border-dashed border-border-strong px-6 py-10 text-center">
          <h1 className="text-section">Couldn't load this invitation</h1>
          <p className="mt-2 text-text-muted">Check your connection and try again.</p>
          <Button className="mt-4" variant="secondary" icon={<RotateCw className="size-5" aria-hidden />} onClick={() => invitation.refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (!invitation.data) {
    return (
      <div className="grid gap-4" aria-busy>
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }
  const { card } = invitation.data;
  const place = [card.venueName, card.city].map((s) => titleCase(s.trim())).filter(Boolean).join(", ");

  return (
    <div>
      <PageHeader
        back={<BackLink to="/invitations" label="Invitations" />}
        title={invitationTitle(card)}
        description={[invitationDate(card), place].filter(Boolean).join(" · ")}
        actions={
          <>
            <Button variant="primary" icon={<UserPlus className="size-5" aria-hidden />} onClick={() => setAdding(true)}>
              Add guest
            </Button>
            <Link to="/invitations/$id/edit" params={{ id }} className={buttonStyles({ variant: "secondary" })}>
              <Pencil className="size-5" aria-hidden /> Edit card
            </Link>
            <Menu>
              <MenuTrigger className={buttonStyles({ variant: "secondary", size: "icon" })} aria-label="More actions">
                <MoreHorizontal className="size-5" aria-hidden />
              </MenuTrigger>
              <MenuContent>
                <MenuItem onClick={() => setPrinting(true)}>
                  <Printer className="size-5" aria-hidden /> Print or PDF
                </MenuItem>
                <MenuItem disabled={duplicating} onClick={() => void duplicate()}>
                  <Copy className="size-5" aria-hidden /> Duplicate
                </MenuItem>
                <MenuSeparator />
                <MenuItem danger onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="size-5" aria-hidden /> Delete
                </MenuItem>
              </MenuContent>
            </Menu>
          </>
        }
      />

      <div className="grid items-start gap-8 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:gap-10">
        <Dialog>
          <DialogTrigger
            aria-label="Open full preview"
            className="mx-auto block w-full max-w-[12rem] overflow-hidden rounded-2xl shadow-raised outline-none transition-transform duration-(--duration-fast) active:scale-[0.98] md:mx-0"
          >
            <InvitationCard card={card} />
          </DialogTrigger>
          <DialogContent title="Preview" size="lg">
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl shadow-raised">
              <InvitationCard card={card} />
            </div>
          </DialogContent>
        </Dialog>

        <div className="grid min-w-0 gap-8">
          <HostMeter eventId={id} />
          <section aria-labelledby="guests" className="grid gap-3">
            <h2 id="guests" className="text-section">
              Guests
            </h2>
            <GuestList eventId={id} onAddFirst={() => setAdding(true)} />
          </section>
        </div>
      </div>

      <AddGuestDialog eventId={id} open={adding} onOpenChange={setAdding} />
      <PrintDialog invitationId={id} open={printing} onOpenChange={setPrinting} />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent
          title="Delete this invitation?"
          description="This removes the invitation and all its guest links. This can't be undone."
          confirmLabel="Delete invitation"
          loading={remove.isPending}
          onConfirm={() => remove.mutate({ id })}
        />
      </AlertDialog>
    </div>
  );
}
