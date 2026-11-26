import { computeMeter } from "@invite-me/api/invites/meter";
import { useQuery } from "@tanstack/react-query";
import { RotateCw } from "lucide-react";

import { StatusHelp } from "@/components/guest-status";
import { Button, EmptyState, Progress, Skeleton } from "@/components/ui";
import { orpc } from "@/utils/orpc";

// Polls so the host sees RSVPs and opens without reloading. Push is not built.
export const POLL_MS = 10_000;

/** One headline ("2 of 6 seats confirmed") and a bar. Statuses and their meanings live with the guest list. */
export function HostMeter({ eventId }: { eventId: string }) {
  // Computed from the same guest list the page already polls, so one request feeds both.
  const parties = useQuery({
    ...orpc.parties.list.queryOptions({ input: { eventId } }),
    refetchInterval: POLL_MS,
  });
  if (parties.isError && !parties.data) {
    return (
      <EmptyState
        title="Couldn't load replies"
        description="Check your connection and try again."
        action={
          <Button variant="secondary" icon={<RotateCw className="size-5" aria-hidden />} onClick={() => parties.refetch()}>
            Retry
          </Button>
        }
      />
    );
  }
  if (!parties.data) return <Skeleton className="h-28 w-full rounded-2xl" />;

  const m = computeMeter(parties.data);
  return (
    <section aria-label="Replies" className="grid gap-3 rounded-2xl border border-border bg-surface p-5">
      <Progress value={m.confirmedSeats} max={Math.max(m.allottedSeats, 1)} label="Confirmed seats">
        <p className="text-section tabular-nums">
          {m.confirmedSeats} of {m.allottedSeats} seats confirmed
        </p>
      </Progress>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-label text-text-muted">
          {m.allottedSeats === 0 ? "Add guests to start tracking replies." : "Updates on its own as guests reply."}
        </p>
        <StatusHelp />
      </div>
    </section>
  );
}
