import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/utils/orpc";

// Polls so the host sees RSVPs and opens without reloading. Push is not built.
export const POLL_MS = 10_000;

export function HostMeter() {
  const meter = useQuery({
    ...orpc.meter.get.queryOptions(),
    refetchInterval: POLL_MS,
  });
  if (!meter.data) return <p className="text-sm text-muted-foreground">Loading meter…</p>;
  const m = meter.data;
  return (
    <section className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm sm:grid-cols-4">
      <Stat label="Confirmed" value={`${m.confirmedSeats} / ${m.allottedSeats}`} />
      <Stat label="Opened seats" value={String(m.openedSeats)} />
      <Stat label="Maybe" value={String(m.maybe)} />
      <Stat label="No" value={String(m.no)} />
      <Stat label="Not opened" value={String(m.notOpened)} />
      <Stat label="Not shared" value={String(m.notShared)} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
