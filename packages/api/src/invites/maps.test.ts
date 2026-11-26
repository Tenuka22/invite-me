import { describe, expect, test } from "bun:test";

import { isGoogleMapsUrl, parseGoogleMapsUrl, resolveMapsUrl } from "./maps";

describe("parseGoogleMapsUrl", () => {
  test("prefers the place pin over the viewport centre", () => {
    const url =
      "https://www.google.com/maps/place/Kingsbury/@6.9330,79.8430,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x1!8m2!3d6.9334!4d79.8428";
    expect(parseGoogleMapsUrl(url)).toEqual({ lat: 6.9334, lng: 79.8428 });
  });

  test("reads q= and @ forms", () => {
    expect(parseGoogleMapsUrl("https://maps.google.com/?q=6.9271,79.8612")).toEqual({ lat: 6.9271, lng: 79.8612 });
    expect(parseGoogleMapsUrl("https://www.google.com/maps/@6.9,79.85,15z")).toEqual({ lat: 6.9, lng: 79.85 });
  });

  test("returns null without coordinates or with impossible ones", () => {
    expect(parseGoogleMapsUrl("https://maps.app.goo.gl/abc123")).toBeNull();
    expect(parseGoogleMapsUrl("https://maps.google.com/?q=95,10")).toBeNull();
  });
});

describe("resolveMapsUrl", () => {
  test("follows a short link to the place", async () => {
    const fake = (async (url: string) =>
      new Response(null, {
        status: 302,
        headers: url.includes("goo.gl")
          ? { location: "https://www.google.com/maps/place/x/data=!3d6.9!4d79.8" }
          : {},
      })) as unknown as typeof fetch;
    expect(await resolveMapsUrl("https://maps.app.goo.gl/abc", fake)).toEqual({ lat: 6.9, lng: 79.8 });
  });

  test("refuses non-Google hosts and redirects off Google", async () => {
    const fake = (async () =>
      new Response(null, { status: 302, headers: { location: "https://evil.example/@1,2" } })) as unknown as typeof fetch;
    expect(isGoogleMapsUrl("http://maps.google.com/?q=1,2")).toBe(false);
    expect(await resolveMapsUrl("https://maps.app.goo.gl/abc", fake)).toBeNull();
  });
});

describe("share.google links", () => {
  test("are accepted as Google links", () => {
    expect(isGoogleMapsUrl("https://share.google/H1WsKgEOkWXZ0uIoI")).toBe(true);
  });

  test("a link that only names a place is looked up by name", async () => {
    const seen: string[] = [];
    const fake = (async (input: RequestInfo | URL) => {
      const url = String(input);
      seen.push(url);
      if (url.startsWith("https://share.google/")) return new Response(null, { status: 302, headers: { location: "https://www.google.com/search?q=The+Kingsbury+Colombo&kgmid=/m/1" } });
      if (url.startsWith("https://www.google.com/search")) return new Response("<html></html>", { status: 200 });
      return Response.json([{ lat: "6.93", lon: "79.84" }]);
    }) as typeof fetch;
    expect(await resolveMapsUrl("https://share.google/abc", fake)).toEqual({ lat: 6.93, lng: 79.84 });
    expect(seen.at(-1)).toContain("q=The%20Kingsbury%20Colombo");
  });
});
