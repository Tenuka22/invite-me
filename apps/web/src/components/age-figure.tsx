import type { AgeGroup } from "@invite-me/api/invites/party";

/** Open Peeps by Pablo Stanley (CC0), saved under `public/age/`; see CREDITS.txt there. */
export const AGE_LABELS: Record<AgeGroup, string> = {
  teen: "Teen",
  adult: "Adult",
  forties: "40s+",
  elder: "Elder",
  family: "Family",
};

export function AgeFigure({ group, className = "size-16" }: { group: AgeGroup; className?: string }) {
  if (group === "family") {
    return (
      <span className={`relative inline-block ${className}`} aria-hidden>
        <img src="/age/family-a.svg" alt="" className="absolute bottom-0 left-0 w-[58%]" />
        <img src="/age/family-b.svg" alt="" className="absolute bottom-0 right-0 w-[58%]" />
        <img src="/age/family-c.svg" alt="" className="absolute bottom-0 left-1/2 w-[46%] -translate-x-1/2" />
      </span>
    );
  }
  return <img src={`/age/${group}.svg`} alt="" aria-hidden className={`${className} object-contain object-bottom`} />;
}
