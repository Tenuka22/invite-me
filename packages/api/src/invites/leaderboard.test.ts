import { describe, expect, test } from "bun:test";

import { type Party, createParty, setRsvp } from "./party";
import { computeMeter } from "./meter";
import { leaderboardScore } from "./leaderboard";
import { deriveAdminInviteSecret, timingSafeEqual } from "./token";

const couple = (rsvp: Exclude<Party["rsvp"], "pending">, headCount?: number): Party => {
  let p = createParty({ id: "p", displayName: "A & B", invitedAs: "couple", locale: "en" });
  p = setRsvp(p, rsvp, headCount);
  return p;
};

describe("leaderboardScore", () => {
  test("ranks by confirmed seats first", () => {
    const confirmed = computeMeter([couple("yes", 2)]);
    const none = computeMeter([couple("pending")]);
    expect(leaderboardScore(confirmed)).toBeGreaterThan(leaderboardScore(none));
  });

  test("opens and maybe count, no subtracts, negatives are clamped by magnitude only", () => {
    const base = { confirmedSeats: 0, maybe: 0, openedSeats: 0, no: 0, notShared: 0 };
    expect(leaderboardScore(base)).toBe(0);
    expect(leaderboardScore({ ...base, confirmedSeats: 2 })).toBe(4);
    expect(leaderboardScore({ ...base, maybe: 1 })).toBe(1.5);
    expect(leaderboardScore({ ...base, openedSeats: 3 })).toBe(1.5);
    expect(leaderboardScore({ ...base, no: 1 })).toBe(-1);
    expect(leaderboardScore({ ...base, notShared: 1 })).toBe(1);
  });
});

describe("admin invite secret", () => {
  test("is deterministic per event id and differs across events", async () => {
    const a1 = await deriveAdminInviteSecret("key", "event1");
    const a2 = await deriveAdminInviteSecret("key", "event1");
    const b = await deriveAdminInviteSecret("key", "event2");
    expect(a1).toBe(a2);
    expect(a1).not.toBe(b);
    expect(timingSafeEqual(a1, b)).toBe(false);
  });

  test("uses the server key", async () => {
    const a = await deriveAdminInviteSecret("keyA", "event1");
    const b = await deriveAdminInviteSecret("keyB", "event1");
    expect(a).not.toBe(b);
  });
});
