import { type Look, type LookOption, resolveLook as resolveWith } from "../look";

export const PRESET_NAME = "Sanni Tiles";

/** Everything a host can change about this design; handled in `tiles.css` and `art.tsx`. */
export const LOOK_OPTIONS = [
  {
    key: "palette",
    label: "Colours",
    hint: "Cream paper on teal tiles, or sand paper on clay tiles.",
    default: "teal",
    choices: [
      { value: "teal", label: "Teal tiles" },
      { value: "clay", label: "Clay tiles" },
    ],
  },
] as const satisfies readonly LookOption[];

export function resolveLook(raw: Look | undefined): Look {
  return resolveWith(LOOK_OPTIONS, raw);
}
