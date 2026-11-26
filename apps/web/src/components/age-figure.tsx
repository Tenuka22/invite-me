import type { AgeGroup } from "@invite-me/api/invites/party";

import { guessGender } from "@/lib/guess-gender";

/** Open Peeps by Pablo Stanley (CC0), saved under `public/age/`; see CREDITS.txt there. */
export const AGE_LABELS: Record<AgeGroup, string> = {
  teen: "Teen",
  adult: "Adult",
  forties: "40s+",
  elder: "Elder",
  family: "Family",
};

/** Which saved figure fits this age and (guessed) gender. The first drawing of each age is the neutral default. */
const FIGURE: Record<Exclude<AgeGroup, "family">, { female: string; male: string; unknown: string }> = {
  teen: { female: "teen", male: "teen-m", unknown: "teen" },
  adult: { female: "adult-f", male: "adult", unknown: "adult" },
  forties: { female: "forties-f", male: "forties", unknown: "forties" },
  elder: { female: "elder", male: "elder-m", unknown: "elder" },
};

/**
 * `name` is the guest's display name; the figure's gender is guessed from it so a woman's name
 * does not get a man's picture.
 */
export function AgeFigure({ group, name = "", className = "size-16" }: { group: AgeGroup; name?: string; className?: string }) {
  if (group === "family") {
    return (
      <span className={`relative inline-block ${className}`} aria-hidden>
        <img src="/age/family-a.svg" alt="" className="absolute bottom-0 left-0 w-[58%]" />
        <img src="/age/family-b.svg" alt="" className="absolute bottom-0 right-0 w-[58%]" />
        <img src="/age/family-c.svg" alt="" className="absolute bottom-0 left-1/2 w-[46%] -translate-x-1/2" />
      </span>
    );
  }
  const gender = guessGender(name);
  const file = FIGURE[group][gender ?? "unknown"];
  return <img src={`/age/${file}.svg`} alt="" aria-hidden className={`${className} object-contain object-bottom`} />;
}

/** The cartoon figure on a soft round plate, for lists. `size` is the plate's tailwind size class. */
export function AgeAvatar({ group, name, className = "size-12" }: { group: AgeGroup; name: string; className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-end justify-items-center overflow-hidden rounded-pill bg-primary-soft ${className}`} aria-hidden>
      <AgeFigure group={group} name={name} className="size-[88%]" />
    </span>
  );
}
