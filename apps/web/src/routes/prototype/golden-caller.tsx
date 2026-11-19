import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_CARD } from "@invite-me/api/invites/card";
import { GoldenCallerCard } from "@/presets/traditional-golden-caller/card";

export const Route = createFileRoute("/prototype/golden-caller")({
  component: GoldenCallerPrototype,
});

function GoldenCallerPrototype() {
  return (
    <main className="flex min-h-dvh flex-col justify-center bg-neutral-900 p-3 lg:p-0">
      <GoldenCallerCard card={DEFAULT_CARD} />
    </main>
  );
}
