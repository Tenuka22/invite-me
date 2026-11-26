import { type Look, type LookOption, resolveLook as resolveWith } from "../look";

export type { Look };

export const PRESET_NAME = "Traditional Golden Caller";

/** What a host can change about the golden caller card. */
export const LOOK_OPTIONS = [
  {
    key: "backdrop",
    label: "Card colour",
    hint: "The paper the card is printed on, on every guest's screen.",
    default: "ivory",
    choices: [
      { value: "ivory", label: "Ivory" },
      { value: "rose", label: "Rose" },
      { value: "midnight", label: "Midnight" },
      { value: "emerald", label: "Emerald" },
    ],
  },
] as const satisfies readonly LookOption[];

/** Golden caller look with defaults filled in. */
export function resolveLook(raw: Look | undefined): Look {
  return resolveWith(LOOK_OPTIONS, raw);
}
