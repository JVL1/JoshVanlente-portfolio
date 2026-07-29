import { describe, expect, it } from "vitest";
import { about, aboutMetaDescription, aboutSchema } from "@/data/about";

// Transcribed from Josh's approved wording, signed off 2026-07-29. Written out
// longhand rather than read off `about`, for the same reason profile.test.ts
// writes the résumé out: an expectation derived from the data under test goes
// green when that data is emptied. tests/component/about-page.test.tsx proves
// the page renders whatever about.ts holds; this proves what about.ts holds.
const APPROVED_NARRATIVE = [
  "I'm an experienced product leader with a track record of delivering results as both a team leader and a hands-on contributor. I'm adaptable, and comfortable navigating both the ambiguity of 0-to-1 innovation and the complexity of scaling an established product. My work spans fintech, proptech, and adtech, across B2C and B2B markets.",
  "What I enjoy most is a big, hard problem that needs systems thinking, the kind where the answer only shows up once you understand how the pieces move together. Lately that has meant rethinking what a product actually needs from its users to produce value, and what can be done by automation or agents instead.",
  "Outside work I have two kids and a beautiful wife, and experiencing things through their eyes has been the most rewarding part of these years. I'm happiest outdoors: hiking, backpacking, and golf.",
];

const APPROVED_EDUCATION = {
  institution: "San Diego State University",
  degree: "B.S. Finance",
  minor: "Environmental Economics",
};

describe("about.narrative", () => {
  it("matches Josh's approved copy exactly", () => {
    expect(about.narrative).toEqual(APPROVED_NARRATIVE);
  });

  // Josh asked for em dashes out of this prose. The component test checks the
  // rendered page; this checks the source, so a paragraph added to about.ts but
  // not yet rendered still fails here.
  it("uses no em dash", () => {
    for (const [index, paragraph] of about.narrative.entries()) {
      expect(paragraph, `paragraph ${index + 1}`).not.toContain("—");
    }
  });
});

describe("aboutMetaDescription", () => {
  // The Google snippet for /about. The description that ran before this was a
  // third-person rewrite of this same sentence, so a searcher met one voice in
  // the result and another on the page.
  it("is the narrative's opening sentence, in Josh's own words", () => {
    expect(aboutMetaDescription).toBe(
      "I'm an experienced product leader with a track record of delivering results as both a team leader and a hands-on contributor.",
    );
  });

  // The point of deriving it is that it cannot drift from the page. Asserting
  // the prefix relationship rather than only the literal above means rewording
  // the narrative's first sentence fails here instead of quietly leaving the
  // snippet describing a page that no longer says that.
  it("stays a prefix of the first paragraph", () => {
    expect(about.narrative[0]!.startsWith(aboutMetaDescription)).toBe(true);
  });
});

describe("about.education", () => {
  // The minor was "corrected" to Sustainability once and the correction was
  // itself wrong; Josh chose Environmental Economics on 2026-07-29. Pinning the
  // whole record makes reversing that a deliberate act rather than a silent one.
  it("matches the approved credential", () => {
    expect(about.education).toEqual(APPROVED_EDUCATION);
  });

  it("carries no graduation year", () => {
    expect(JSON.stringify(about.education)).not.toMatch(/\d{4}/);
  });
});

// The reason about.ts parses at module scope is that bad data should fail
// `next build` rather than ship a blank page. Nothing proved that until here:
// importing `about` only ever exercises the passing case.
describe("the about schema", () => {
  it("accepts the shipped record", () => {
    expect(() =>
      aboutSchema.parse({
        narrative: APPROVED_NARRATIVE,
        education: APPROVED_EDUCATION,
      }),
    ).not.toThrow();
  });

  it("rejects an empty narrative", () => {
    expect(() =>
      aboutSchema.parse({ narrative: [], education: APPROVED_EDUCATION }),
    ).toThrow();
  });

  it("rejects an empty paragraph", () => {
    expect(() =>
      aboutSchema.parse({ narrative: [""], education: APPROVED_EDUCATION }),
    ).toThrow();
  });

  // A space passes `.min(1)` and renders as a blank line, which is the failure
  // the module-scope parse exists to prevent.
  it("rejects a whitespace-only paragraph", () => {
    expect(() =>
      aboutSchema.parse({ narrative: ["   "], education: APPROVED_EDUCATION }),
    ).toThrow();
  });

  it("rejects a missing education field", () => {
    expect(() =>
      aboutSchema.parse({
        narrative: APPROVED_NARRATIVE,
        education: { institution: "X", degree: "Y" },
      }),
    ).toThrow();
  });

  // strictObject is what stops the six "Skills" cards Josh asked to drop being
  // quietly reintroduced through the data file.
  it("rejects an unknown field", () => {
    expect(() =>
      aboutSchema.parse({
        narrative: APPROVED_NARRATIVE,
        education: APPROVED_EDUCATION,
        skills: [],
      }),
    ).toThrow();
  });
});
