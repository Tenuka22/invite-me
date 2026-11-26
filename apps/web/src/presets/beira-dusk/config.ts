import { type Look, type LookOption, resolveLook as resolveWith } from "../look";

export const PRESET_NAME = "Beira Dusk";

/** Everything a host can change about the Beira Dusk page; handled in `beira.css` and `page.tsx`. */
export const LOOK_OPTIONS = [
  {
    key: "hour",
    label: "Time of evening",
    hint: "When the sky is set on the first screen. Guests always scroll into night.",
    default: "dusk",
    choices: [
      { value: "golden", label: "Golden hour" },
      { value: "dusk", label: "Dusk" },
    ],
  },
  {
    key: "music",
    label: "Music",
    hint: "A quiet drone with temple bells. Guests switch it on themselves; it never plays on its own.",
    default: "offer",
    choices: [
      { value: "offer", label: "Offer music" },
      { value: "off", label: "No music" },
    ],
  },
] as const satisfies readonly LookOption[];

export function resolveLook(raw: Look | undefined): Look {
  return resolveWith(LOOK_OPTIONS, raw);
}
