export type Gender = "female" | "male";

const FEMALE_TITLES = /^(mrs|miss|ms|madam|aunty|auntie|aunt|sister|akka|nangi|amma|lady|mother|grandma)\b/i;
const MALE_TITLES = /^(mr|mister|sir|uncle|master|brother|aiya|malli|thaththa|father|grandpa|dr\.? ?mr)\b/i;
const NOT_A_PERSON = /\b(family|families|friends|team|group|colleagues|and|&)\b/i;

/** Sinhala and Tamil names that end in "a" but are men's, plus the common men's endings. */
const MALE_A = /(eera|chara|mara|ndra|nda|inda|ula|ushka|thissa|atha|aka|ika|oka|uka)$/;
const FEMALE_END =
  /(wi|ni|ri|di|li|ti|si|ki|hi|vi|mi|pi|gi|ji|shi|thi|ee|ie|ey|ine|elle|ette|lyn|beth|isha|asha|usha|nusha|ndya|riya|aya|iya|ela|ana|ina|ara)$/;

/**
 * A best guess at a guest's gender from their name, used only to pick a matching avatar.
 * Returns null for families, groups and names it can't read, and the caller shows a neutral figure.
 */
export function guessGender(displayName: string): Gender | null {
  const text = displayName.trim();
  if (!text || NOT_A_PERSON.test(text)) return null;
  const withoutDots = text.replace(/\./g, " ").replace(/\s+/g, " ").trim();
  if (FEMALE_TITLES.test(withoutDots)) return "female";
  if (MALE_TITLES.test(withoutDots)) return "male";
  const words = withoutDots.split(" ").filter((w) => !/^(mr|mrs|miss|ms|dr|prof|rev|aunty|uncle)$/i.test(w));
  const first = (words[0] ?? "").toLowerCase().replace(/[^a-z]/g, "");
  if (first.length < 3) return null;
  if (first.endsWith("a") && MALE_A.test(first)) return "male";
  if (FEMALE_END.test(first) || first.endsWith("a")) return "female";
  if (/[a-z]$/.test(first) && !/[aeiouy]$/.test(first)) return "male";
  return null;
}
