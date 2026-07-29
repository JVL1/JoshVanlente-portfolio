import { z } from "zod";

const educationSchema = z.strictObject({
  institution: z.string().min(1),
  degree: z.string().min(1),
  minor: z.string().min(1),
});

const aboutSchema = z.strictObject({
  narrative: z.array(z.string().min(1)).min(1),
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
