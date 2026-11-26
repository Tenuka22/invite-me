import { type Look, type LookOption, resolveLook as resolveWith } from "../look";

export const PRESET_NAME = "Ceylon Block Print";

/** Everything a host can change about this design; handled in `ceylon.css` and `art.tsx`. */
export const LOOK_OPTIONS = [
  {
    key: "palette",
    label: "Colours",
    hint: "Red ink on oatmeal paper, or coral with sage green and navy.",
    default: "crimson",
    choices: [
      { value: "crimson", label: "Red on oatmeal" },
      { value: "coral", label: "Coral, sage and navy" },
    ],
  },
] as const satisfies readonly LookOption[];

export function resolveLook(raw: Look | undefined): Look {
  return resolveWith(LOOK_OPTIONS, raw);
}
