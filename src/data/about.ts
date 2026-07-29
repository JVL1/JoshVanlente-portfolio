import { z } from "zod";

// `.min(1)` alone accepts a single space, which renders as an empty line and
// still builds. Requiring a non-whitespace character is what makes the claim
// "an empty narrative fails the build" true for the blank-looking cases too.
const nonBlank = z.string().regex(/\S/, "expected a non-whitespace character");

export const educationSchema = z.strictObject({
  institution: nonBlank,
  degree: nonBlank,
  minor: nonBlank,
});

// Exported so tests/unit/about.test.ts can prove the rejection cases directly.
// The parse below runs at module scope, so a reader importing `about` cannot
// observe a rejection; only the schema itself can be asked what it refuses.
export const aboutSchema = z.strictObject({
  narrative: z.array(nonBlank).min(1),
  education: educationSchema,
});

export type Education = z.infer<typeof educationSchema>;
export type About = z.infer<typeof aboutSchema>;

export const about: About = aboutSchema.parse({
  narrative: [
    "I'm an experienced product leader with a track record of delivering results as both a team leader and a hands-on contributor. I'm adaptable, and comfortable navigating both the ambiguity of 0-to-1 innovation and the complexity of scaling an established product. My work spans fintech, proptech, and adtech, across B2C and B2B markets.",
    "What I enjoy most is a big, hard problem that needs systems thinking, the kind where the answer only shows up once you understand how the pieces move together. Lately that has meant rethinking what a product actually needs from its users to produce value, and what can be done by automation or agents instead.",
    "Outside work I have two kids and a beautiful wife, and experiencing things through their eyes has been the most rewarding part of these years. I'm happiest outdoors: hiking, backpacking, and golf.",
  ],
  education: {
    institution: "San Diego State University",
    degree: "B.S. Finance",
    minor: "Environmental Economics",
  },
});
