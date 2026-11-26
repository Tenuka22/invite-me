import { describe, expect, test } from "bun:test";

import { computeMeter } from "./meter";
import {
  createParty,
  InviteError,
  markShared,
  recordOpen,
  revoke,
  seatsFor,
  setRsvp,
  statusOf,
} from "./party";
import { hashSecret, parseLinkToken, randomToken, timingSafeEqual } from "./token";

const base = { id: "p1", displayName: "Nimal", locale: "en" as const };

describe("seats", () => {
  test("single, couple and group map to 1, 2 and N", () => {
    expect(seatsFor("single")).toBe(1);
    expect(seatsFor("couple")).toBe(2);
    expect(seatsFor("group", 5)).toBe(5);
  });

  test("group rejects missing, zero, fractional and oversized counts", () => {
    for (const bad of [undefined, 0, 2.5, 51]) {
      expect(() => seatsFor("group", bad)).toThrow(InviteError);
    }
  });
});

describe("party lifecycle", () => {
  test("created -> shared -> opened -> responded", () => {
    let p = createParty({ ...base, invitedAs: "single" });
    expect(statusOf(p)).toBe("created");
    p = markShared(p);
    expect(statusOf(p)).toBe("shared");
    p = recordOpen(p, 1000);
    expect(statusOf(p)).toBe("opened");
    p = setRsvp(p, "no");
    expect(statusOf(p)).toBe("responded");
  });

  test("open records count and first/last timestamps", () => {
    let p = createParty({ ...base, invitedAs: "couple" });
    p = recordOpen(p, 100);
    p = recordOpen(p, 200);
    expect(p.opens).toBe(2);
    expect(p.firstOpenedAt).toBe(100);
    expect(p.lastOpenedAt).toBe(200);
  });

  test("yes requires a head-count within the allotted seats", () => {
    const p = createParty({ ...base, invitedAs: "couple" });
    expect(setRsvp(p, "yes", 2).confirmedSeats).toBe(2);
    expect(() => setRsvp(p, "yes", 0)).toThrow(InviteError);
    expect(() => setRsvp(p, "yes")).toThrow(InviteError);
    expect(() => setRsvp(p, "yes", 3)).toThrow(/Only 2 seat/);
  });

  test("changing to maybe or no clears the confirmed head-count", () => {
    const yes = setRsvp(createParty({ ...base, invitedAs: "group", groupSize: 4 }), "yes", 4);
    expect(setRsvp(yes, "maybe").confirmedSeats).toBe(0);
  });

  test("revoked parties reject every change", () => {
    const p = revoke(createParty({ ...base, invitedAs: "single" }));
    expect(statusOf(p)).toBe("revoked");
    expect(() => recordOpen(p, 1)).toThrow(InviteError);
    expect(() => setRsvp(p, "yes", 1)).toThrow(InviteError);
    expect(() => markShared(p)).toThrow(InviteError);
  });

  test("name is trimmed and required", () => {
    expect(createParty({ ...base, displayName: "  Ann  ", invitedAs: "single" }).displayName).toBe("Ann");
    expect(() => createParty({ ...base, displayName: "   ", invitedAs: "single" })).toThrow(InviteError);
  });
});

describe("meter", () => {
  test("confirmed, opened and missing counts", () => {
    const a = setRsvp(recordOpen(markShared(createParty({ ...base, id: "a", invitedAs: "couple" })), 1), "yes", 2);
    const b = recordOpen(createParty({ ...base, id: "b", invitedAs: "single" }), 2);
    const c = setRsvp(createParty({ ...base, id: "c", invitedAs: "group", groupSize: 3 }), "maybe");
    const gone = revoke(createParty({ ...base, id: "d", invitedAs: "group", groupSize: 9 }));

    expect(computeMeter([a, b, c, gone])).toEqual({
      allottedSeats: 6,
      confirmedSeats: 2,
      openedSeats: 3,
      maybe: 1,
      no: 0,
      notOpened: 1,
      notShared: 2,
    });
  });
});

describe("tokens", () => {
  test("random tokens are url-safe and unique", () => {
    const tokens = new Set(Array.from({ length: 200 }, () => randomToken()));
    expect(tokens.size).toBe(200);
    for (const t of tokens) expect(t).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  test("hash is deterministic and differs from the secret", async () => {
    const secret = randomToken();
    expect(await hashSecret(secret)).toBe(await hashSecret(secret));
    expect(await hashSecret(secret)).not.toContain(secret);
  });

  test("link tokens split on the first dot", () => {
    expect(parseLinkToken("abc.def.ghi")).toEqual({ id: "abc", secret: "def.ghi" });
    expect(parseLinkToken("abc.")).toBeNull();
    expect(parseLinkToken(".abc")).toBeNull();
    expect(parseLinkToken("abc")).toBeNull();
  });

  test("timing-safe compare rejects differing and different-length input", () => {
    expect(timingSafeEqual("abcd", "abcd")).toBe(true);
    expect(timingSafeEqual("abcd", "abce")).toBe(false);
    expect(timingSafeEqual("abcd", "abc")).toBe(false);
  });
});
