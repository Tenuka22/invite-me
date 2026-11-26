import { computeMeter } from "@invite-me/api/invites/meter";
import { AnimatedNumber } from "@invite-me/ui/components/motion/animated-number";
import { Card, CardContent } from "@invite-me/ui/components/motion/card";
import { Skeleton } from "@/components/skeletons";
import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

// Polls so the host sees RSVPs and opens without reloading. Push is not built.
export const POLL_MS = 10_000;

export function HostMeter({ eventId }: { eventId: string }) {
  // The meter is computed from the same guest list the page already polls, so one request feeds both.
  const parties = useQuery({
    ...orpc.parties.list.queryOptions({ input: { eventId } }),
    refetchInterval: POLL_MS,
  });
  if (!parties.data) {
    return (
      <Skeleton className="h-56 w-full rounded-3xl" />
    );
  }
  const m = computeMeter(parties.data);
  const percent = m.allottedSeats > 0 ? Math.round((m.confirmedSeats / m.allottedSeats) * 100) : 0;
  return (
    <Card>
      <CardContent className="grid gap-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Confirmed seats</p>
            <p className="flex items-baseline gap-2 font-[Fraunces_Variable,Fraunces,Georgia,serif] text-4xl lining-nums tabular-nums sm:text-5xl">
              <AnimatedNumber value={m.confirmedSeats} />
              <span className="text-2xl font-normal text-muted-foreground sm:text-3xl">
                / {m.allottedSeats}
              </span>
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {m.allottedSeats === 0 ? "Add guests to start the meter" : `${percent}% of invited seats`}
          </p>
        </div>
        <div
          role="meter"
          aria-label="Confirmed seats"
          aria-valuemin={0}
          aria-valuemax={Math.max(m.allottedSeats, 1)}
          aria-valuenow={m.confirmedSeats}
          className="h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <Stat label="Opened seats" value={m.openedSeats} />
          <Stat label="Maybe" value={m.maybe} />
          <Stat label="No" value={m.no} />
          <Stat label="Not opened" value={m.notOpened} />
          <Stat label="Not shared" value={m.notShared} className="col-span-2 sm:col-span-1" />
        </dl>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">
        <AnimatedNumber value={value} />
      </dd>
    </div>
  );
}
