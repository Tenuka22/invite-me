import { AGE_GROUPS, type AgeGroup } from "@invite-me/api/invites/party";
import { DEFAULT_CARD, PRESETS as PRESET_IDS, type PresetId } from "@invite-me/api/invites/card";
import { Button } from "@invite-me/ui/components/motion/button/base";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { PRESETS } from "@/presets";
import { LookPicker } from "@/presets/look-picker";

export const Route = createFileRoute("/prototype/$preset")({
  // Design scratchpad: development only, so it never ships as a public page.
  beforeLoad: ({ params }) => {
    if (!import.meta.env.DEV || !(PRESET_IDS as readonly string[]).includes(params.preset)) throw notFound();
  },
  component: Prototype,
});

/** Sample content, labelled as such: a future date so the countdown runs, and a real Colombo location. */
const SAMPLE = {
  ...DEFAULT_CARD,
  date: "2027-01-23",
  mapsUrl: "https://maps.google.com/?q=6.9295,79.8433",
  venueGeo: { lat: 6.9295, lng: 79.8433 },
};

function Prototype() {
  const id = Route.useParams().preset as PresetId;
  const preset = PRESETS[id];
  const [look, setLook] = useState<Record<string, string>>({});
  const [age, setAge] = useState<AgeGroup>("family");
  const [answer, setAnswer] = useState("pending");
  const [panel, setPanel] = useState(false);
  const { GuestPage } = preset;
  return (
    <>
      <GuestPage
        card={{ ...SAMPLE, preset: id, look }}
        party={{ displayName: "Silva Family", ageGroup: age, seats: 4, seatLabel: "Hall B, table 4", rules: "Please arrive by 9.00 AM" }}
        answer={answer}
        onAnswer={(status) => setAnswer(status)}
      />
      <div className="fixed top-3 left-3 z-50 grid max-w-[min(92vw,360px)] justify-items-start gap-2">
        <Button size="sm" variant="secondary" onClick={() => setPanel((v) => !v)}>
          {panel ? "Close" : "Prototype controls"}
        </Button>
        {panel ? (
          <div className="grid gap-4 rounded-2xl border bg-background p-4 text-foreground shadow-lg">
            <LookPicker options={preset.lookOptions} look={look} onChange={setLook} />
            <div className="flex flex-wrap gap-2">
              {AGE_GROUPS.map((a) => (
                <Button key={a} size="sm" variant={a === age ? "primary" : "outline"} onClick={() => setAge(a)}>
                  {a}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
