import type { PartyView } from "@invite-me/api/invites/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, RotateCw, Search, UserPlus, Users } from "lucide-react";
import { useMemo, useState } from "react";

import { guestLink, useGuestShare } from "@/components/guest-share";
import { GuestRow } from "@/components/guest-row";
import { guestStatus, STATUS, STATUS_ORDER, type GuestStatus } from "@/components/guest-status";
import { POLL_MS } from "@/components/host-meter";
import { PrintDialog } from "@/components/print-dialog";
import { toast } from "@/components/toaster";
import {
  AlertDialog,
  AlertDialogContent,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  EmptyState,
  FilterChips,
  Input,
  Skeleton,
} from "@/components/ui";
import { orpc } from "@/utils/orpc";

type Filter = "all" | GuestStatus;

export function GuestList({ eventId, onAddFirst }: { eventId: string; onAddFirst: () => void }) {
  const queryClient = useQueryClient();
  const parties = useQuery({
    ...orpc.parties.list.queryOptions({ input: { eventId } }),
    refetchInterval: POLL_MS,
  });
  const share = useGuestShare(eventId);
  const revoke = useMutation(
    orpc.parties.revoke.mutationOptions({
      onSuccess: async () => {
        toast.success("Link revoked", { description: "That guest can no longer open the invitation." });
        setRevoking(null);
        await queryClient.invalidateQueries({ queryKey: orpc.parties.list.queryKey({ input: { eventId } }) });
      },
      onError: (error) => toast.error("Could not revoke the link", { description: error.message }),
    }),
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [revoking, setRevoking] = useState<PartyView | null>(null);
  const [linkOf, setLinkOf] = useState<PartyView | null>(null);
  const [printing, setPrinting] = useState<PartyView | null>(null);

  const counts = useMemo(() => {
    const c: Partial<Record<GuestStatus, number>> = {};
    for (const p of parties.data ?? []) {
      const s = guestStatus(p);
      c[s] = (c[s] ?? 0) + 1;
    }
    return c;
  }, [parties.data]);

  if (parties.isError && !parties.data) {
    return (
      <EmptyState
        title="Couldn't load your guests"
        description="Check your connection and try again."
        action={
          <Button variant="secondary" icon={<RotateCw className="size-5" aria-hidden />} onClick={() => parties.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!parties.data) {
    return (
      <div className="grid gap-3">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
    );
  }
  if (parties.data.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No guests yet"
        description="Add your first guest to get a private invitation link."
        action={
          <Button icon={<UserPlus className="size-5" aria-hidden />} onClick={onAddFirst}>
            Add guest
          </Button>
        }
      />
    );
  }

  const needle = query.trim().toLowerCase();
  const visible = [...parties.data]
    .sort((a, b) => b.createdAt - a.createdAt)
    .filter((p) => (filter === "all" || guestStatus(p) === filter) && (!needle || p.displayName.toLowerCase().includes(needle) || (p.seatLabel ?? "").toLowerCase().includes(needle)));

  const chips = [
    { value: "all", label: `All ${parties.data.length}` },
    ...[...STATUS_ORDER, "revoked" as const]
      .filter((s) => counts[s])
      .map((s) => ({ value: s, label: `${STATUS[s].label} ${counts[s]}`, icon: undefined })),
  ];

  return (
    <div className="grid gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-text-muted" aria-hidden />
        <Input
          type="search"
          aria-label="Search guests"
          placeholder="e.g. Nimal"
          autoComplete="off"
          className="pl-12"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <FilterChips aria-label="Filter guests by status" value={filter} onValueChange={(v) => setFilter(v as Filter)} options={chips} />

      {visible.length === 0 ? (
        <EmptyState
          title="No guests match"
          description="Try a different name or choose another status."
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
            >
              Clear search
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {visible.map((party) => (
            <GuestRow
              key={party.id}
              party={party}
              actions={{
                copy: share.copy,
                share: share.share,
                whatsapp: share.openWhatsapp,
                showLink: setLinkOf,
                print: setPrinting,
                revoke: setRevoking,
              }}
            />
          ))}
        </ul>
      )}

      <AlertDialog open={revoking !== null} onOpenChange={(open) => !open && setRevoking(null)}>
        <AlertDialogContent
          title={`Revoke ${revoking?.displayName ?? "this"} link?`}
          description="That guest will no longer be able to open the invitation. This can't be undone."
          confirmLabel="Revoke link"
          loading={revoke.isPending}
          onConfirm={() => revoking && revoke.mutate({ id: revoking.id })}
        />
      </AlertDialog>

      <Dialog open={linkOf !== null} onOpenChange={(open) => !open && setLinkOf(null)}>
        <DialogContent
          title="Guest link"
          description={linkOf ? `Private link for ${linkOf.displayName}.` : undefined}
          size="sm"
          footer={
            <>
              <DialogClose render={<Button variant="secondary" />}>Close</DialogClose>
              <Button icon={<Copy className="size-5" aria-hidden />} onClick={() => linkOf && share.copy(linkOf)}>
                Copy link
              </Button>
            </>
          }
        >
          <p className="break-all rounded-xl bg-muted px-4 py-3 text-label text-text-muted">{linkOf ? guestLink(linkOf) : ""}</p>
        </DialogContent>
      </Dialog>

      <PrintDialog
        invitationId={eventId}
        guestId={printing?.id}
        open={printing !== null}
        onOpenChange={(open) => !open && setPrinting(null)}
      />
    </div>
  );
}
