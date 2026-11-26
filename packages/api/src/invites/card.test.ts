import { describe, expect, test } from "bun:test";

import { formatTime, hostBlock, joinPlace, possessive, timeRange } from "./card";

describe("card copy", () => {
  test("one time format, ranges read 'to'", () => {
    expect(formatTime("9.28 pm")).toBe("9:28 PM");
    expect(formatTime("9:28pm")).toBe("9:28 PM");
    expect(formatTime("9 AM")).toBe("9:00 AM");
    expect(timeRange({ timeFrom: "9.28 PM", timeTo: "1.28 AM" })).toBe("9:28 PM to 1:28 AM");
    expect(timeRange({ timeFrom: "9.30 AM", timeTo: "" })).toBe("9:30 AM");
  });

  test("possessives use 's", () => {
    expect(possessive("Matheesha")).toBe("Matheesha's");
    expect(possessive("James")).toBe("James's");
    expect(possessive("SADANI")).toBe("SADANI'S");
  });

  test("a lost apostrophe is put back on host lines", () => {
    const base = { hostMode: "parents", hostLine2: "", connector: "", requestLine: "", occasionLine: "" } as const;
    expect(hostBlock({ ...base, hostLine1: "AMMA PAPA SADANI'S MATHEESHAS PARENTS" }).hosts[0]).toBe("AMMA PAPA SADANI'S MATHEESHA'S PARENTS");
    expect(hostBlock({ ...base, hostLine1: "Mr. & Mrs. Perera" }).hosts[0]).toBe("Mr. & Mrs. Perera");
  });

  test("no stray space before a comma", () => {
    expect(joinPlace("Beach Resort ", "Weligama")).toBe("Beach Resort, Weligama");
    expect(joinPlace("Beach Resort , ", " Weligama")).toBe("Beach Resort, Weligama");
  });
});
