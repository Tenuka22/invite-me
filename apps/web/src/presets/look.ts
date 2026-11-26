/** A preset declares its customisable look as options; the API stores only `card.look` (key to value). */
export type LookChoice = { value: string; label: string };
export type LookOption = {
  key: string;
  label: string;
  hint?: string;
  choices: readonly LookChoice[];
  default: string;
};
export type Look = Record<string, string>;

/** Fills defaults and drops unknown values, so stale or hand-edited data never breaks a page. */
export function resolveLook(options: readonly LookOption[], raw: Look | undefined): Look {
  const out: Look = {};
  for (const option of options) {
    const picked = raw?.[option.key];
    out[option.key] = picked && option.choices.some((c) => c.value === picked) ? picked : option.default;
  }
  return out;
}
