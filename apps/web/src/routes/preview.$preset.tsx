import type { Card } from "@invite-me/api/invites/card";
import { PRESETS as PRESET_IDS, type PresetId } from "@invite-me/api/invites/card";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

import { PRESETS } from "@/presets";
import { NO_GUEST, SAMPLE_PARTY, sampleCard } from "@/presets/sample";

/**
 * A design shown at the size of the window it is in. `?lite=1` is the light version for small
 * previews. Inside the card editor's iframe the parent sends the host's draft as they type.
 */
export const Route = createFileRoute("/preview/$preset")({
  validateSearch: z.object({ lite: z.coerce.boolean().optional(), print: z.coerce.boolean().optional() }),
  head: () => ({ meta: [{ title: "Preview" }, { name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: ({ params }) => {
    if (!(PRESET_IDS as readonly string[]).includes(params.preset)) throw notFound();
  },
  component: Preview,
});

function Preview() {
  const id = Route.useParams().preset as PresetId;
  const { lite: liteParam, print } = Route.useSearch();
  const lite = liteParam || print;
  const [answer, setAnswer] = useState("pending");
  const [draft, setDraft] = useState<Card | null>(null);
  const [guest, setGuest] = useState<typeof SAMPLE_PARTY | null>(null);
  const [fromParent, setFromParent] = useState(false);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== "invite-preview") return;
      setDraft(e.data.card as Card);
      setGuest((e.data.party as typeof SAMPLE_PARTY | undefined) ?? null);
      setFromParent(true);
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "invite-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const card = draft ?? sampleCard(id);
  const { GuestPage } = PRESETS[card.preset] ?? PRESETS[id];
  // A card sent by its owner is the truth: no guest means no guest, not a sample one. Only a page
  // that nothing has spoken to (the design catalogue) borrows the sample so the card looks alive.
  const party = fromParent ? (guest ?? NO_GUEST) : SAMPLE_PARTY;
  return <GuestPage card={card} party={party} answer={answer} lite={lite} print={print} onAnswer={(s) => setAnswer(s)} />;
}
