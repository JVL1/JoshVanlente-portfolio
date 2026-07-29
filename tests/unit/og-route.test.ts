import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { profile } from "@/data/profile";
import { site } from "@/lib/site";

const ROUTE_PATH = fileURLToPath(
  new URL("../../src/app/og/route.tsx", import.meta.url),
);
const source = readFileSync(ROUTE_PATH, "utf8");

const FONT_PATH = fileURLToPath(
  new URL("../../public/fonts/Inter.ttf", import.meta.url),
);

/**
 * The `usWeightClass` field of the font's OS/2 table: the weight the face
 * actually draws. Read from the file rather than written down here, so the
 * assertion below tracks whatever font ships instead of a copy of one number.
 */
function faceWeight(path: string): number {
  const buf = readFileSync(path);
  const tableCount = buf.readUInt16BE(4);
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + i * 16;
    if (buf.toString("ascii", record, record + 4) === "OS/2") {
      return buf.readUInt16BE(buf.readUInt32BE(record + 8) + 4);
    }
  }
  throw new Error(`no OS/2 table in ${path}`);
}

describe("og route", () => {
  it("prerenders rather than running per request", async () => {
    const route = await import("@/app/og/route");

    expect(route.dynamic).toBe("force-static");
    // An edge runtime would put the card back on a live isolate for an image
    // whose content cannot change between requests.
    expect(route).not.toHaveProperty("runtime");
  });

  it("takes no per-request input", async () => {
    const route = await import("@/app/og/route");

    // Arity, not source text: a handler that reads nothing off the request
    // declares no parameter to read it from.
    expect(route.GET).toHaveLength(0);
    expect(source).not.toMatch(/searchParams/);
  });

  it("renders a PNG at the dimensions site.ts promises crawlers", async () => {
    const { GET } = await import("@/app/og/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");

    const png = Buffer.from(await response.arrayBuffer());
    // A PNG's IHDR chunk is always first: width and height are the two 32-bit
    // big-endian words at offsets 16 and 20.
    expect(png.readUInt32BE(16)).toBe(site.defaultOgImage.width);
    expect(png.readUInt32BE(20)).toBe(site.defaultOgImage.height);
  });

  it("prints the name once and the role once, both from profile.ts", () => {
    expect(source.match(/\{profile\.name\}/g)).toHaveLength(1);
    expect(source.match(/\{profile\.role\}/g)).toHaveLength(1);
    // Neither string may be spelled out in the route.
    expect(source).not.toContain(profile.name);
    expect(source).not.toContain(profile.role);
  });

  it("declares the Inter face at the one weight it can draw", () => {
    // Satori files a face registered without a weight as 400 and hands it back
    // for every lookup, so a `fontWeight` on an element renders identically at
    // any value. Registering the real weight is what keeps the card honest.
    expect(source).toMatch(new RegExp(`weight:\\s*${faceWeight(FONT_PATH)}\\b`));
    expect(
      source,
      "a single-weight face cannot render a fontWeight distinction",
    ).not.toMatch(/fontWeight\s*:/);
  });
});
