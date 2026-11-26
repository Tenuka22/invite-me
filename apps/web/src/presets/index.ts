import type { PresetId } from "@invite-me/api/invites/card";

import { BeiraGuestPage } from "./beira-dusk/art";
import { LOOK_OPTIONS as BEIRA_LOOK, PRESET_NAME as BEIRA_NAME } from "./beira-dusk/config";
import { BeiraThumb } from "./beira-dusk/thumb";
import { GoldenGuestPage } from "./traditional-golden-caller/art";
import { LOOK_OPTIONS as GOLDEN_LOOK, PRESET_NAME as GOLDEN_NAME } from "./traditional-golden-caller/config";
import { GoldenThumb } from "./traditional-golden-caller/thumb";
import type { Preset } from "./types";

export const PRESETS: Record<PresetId, Preset> = {
  "traditional-golden-caller": {
    name: GOLDEN_NAME,
    blurb: "Ivory paper and a gold mandala, on one screen.",
    lookOptions: GOLDEN_LOOK,
    GuestPage: GoldenGuestPage,
    Thumb: GoldenThumb,
  },
  "beira-dusk": {
    name: BEIRA_NAME,
    blurb: "A sunset over Beira Lake, on one screen.",
    lookOptions: BEIRA_LOOK,
    GuestPage: BeiraGuestPage,
    Thumb: BeiraThumb,
  },
};

export function presetFor(id: string | undefined): Preset {
  return PRESETS[id as PresetId] ?? PRESETS["traditional-golden-caller"];
}
