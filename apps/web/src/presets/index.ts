import type { PresetId } from "@invite-me/api/invites/card";

import { BeiraGuestPage } from "./beira-dusk/art";
import { LOOK_OPTIONS as BEIRA_LOOK, PRESET_NAME as BEIRA_NAME } from "./beira-dusk/config";
import { CeylonGuestPage } from "./ceylon-block-print/art";
import { LOOK_OPTIONS as CEYLON_LOOK, PRESET_NAME as CEYLON_NAME } from "./ceylon-block-print/config";
import { LOOK_OPTIONS as SANNI_LOOK, PRESET_NAME as SANNI_NAME } from "./sanni-tiles/config";
import { SanniGuestPage } from "./sanni-tiles/art";
import { GoldenGuestPage } from "./traditional-golden-caller/art";
import { LOOK_OPTIONS as GOLDEN_LOOK, PRESET_NAME as GOLDEN_NAME } from "./traditional-golden-caller/config";
import type { Preset } from "./types";

export const PRESETS: Record<PresetId, Preset> = {
  "traditional-golden-caller": {
    name: GOLDEN_NAME,
    blurb: "Ivory paper and a gold mandala, on one screen.",
    lookOptions: GOLDEN_LOOK,
    GuestPage: GoldenGuestPage,
  },
  "beira-dusk": {
    name: BEIRA_NAME,
    blurb: "A sunset over Beira Lake, on one screen.",
    lookOptions: BEIRA_LOOK,
    GuestPage: BeiraGuestPage,
  },
  "ceylon-block-print": {
    name: CEYLON_NAME,
    blurb: "Hand-drawn island motifs in red ink or coral and sage, left aligned.",
    lookOptions: CEYLON_LOOK,
    GuestPage: CeylonGuestPage,
  },
  "sanni-tiles": {
    name: SANNI_NAME,
    blurb: "Heavy capitals over a grid of flat-colour tiles, left aligned.",
    lookOptions: SANNI_LOOK,
    GuestPage: SanniGuestPage,
  },
};

export function presetFor(id: string | undefined): Preset {
  return PRESETS[id as PresetId] ?? PRESETS["traditional-golden-caller"];
}
