import { z } from "zod";

const dateish = z
  .string()
  .regex(/^\d{4}(-\d{2})?$/, "expected YYYY or YYYY-MM");

const roleSchema = z.object({
  id: z.string().min(1),
  org: z.string().min(1),
  title: z.string().min(1),
  start: dateish,
  end: dateish.nullable(),
  achievements: z.array(z.string().min(1)).min(1),
});

const headlineOutcomeSchema = z.object({
  metric: z.string().min(1),
  label: z.string().min(1),
  org: z.string().min(1),
  period: z.string().min(1),
  slug: z.string().min(1).optional(),
});

const profileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  disciplines: z.string().min(1),
  // Zod 4: the top-level z.email()/z.url() replace the deprecated
  // z.string().email() / z.string().url() method forms.
  email: z.email(),
  links: z.object({ linkedin: z.url(), github: z.url() }),
  roles: z
    .array(roleSchema)
    .min(1)
    .refine((rs) => new Set(rs.map((r) => r.id)).size === rs.length, {
      message: "src/data/profile.ts: field 'roles' contains a duplicate id",
    }),
  headlineOutcomes: z.array(headlineOutcomeSchema).length(4, {
    message:
      "src/data/profile.ts: field 'headlineOutcomes' must contain exactly four entries — " +
      "the metric strip is a four-column layout; three leaves a hole and five wraps",
  }),
});

export type Role = z.infer<typeof roleSchema>;
export type HeadlineOutcome = z.infer<typeof headlineOutcomeSchema>;
export type Profile = z.infer<typeof profileSchema>;

export const profile: Profile = profileSchema.parse({
  name: "Josh Van Lente",
  role: "Staff Product Manager",
  disciplines: "Vertical SaaS · FinTech · AI",
  email: "Josh@vanlente.net",
  links: {
    linkedin: "https://www.linkedin.com/in/josh-van-lente/",
    github: "https://github.com/JVL1",
  },
  roles: [
    {
      id: "evernest-staff-pm",
      org: "Evernest",
      title: "Staff Product Manager, AI/LLM Initiatives",
      start: "2025-09",
      end: null,
      achievements: [
        "Defined Envoy, an agent-based property platform, and secured exec funding for an 18-month roadmap against a modeled ~50% cut in operational workload.",
      ],
    },
    {
      id: "built-principal-pm",
      org: "Built",
      title: "Principal Product Manager",
      start: "2025-03",
      end: "2025-08",
      achievements: [
        "Re-architected budgeting into a recursive model with unlimited depth, so developers could trace an overrun down to timber prices. Helped close Tishman Speyer.",
      ],
    },
    {
      id: "azibo-senior-manager",
      org: "Azibo",
      title: "Senior Manager, Product Management",
      start: "2023-03",
      end: "2025-03",
      achievements: [
        "Led 3 PMs and 1 QA. 2.8× monetized users, 3.5× gross margin per user, and a 7-product suite.",
      ],
    },
    {
      id: "azibo-senior-pm",
      org: "Azibo",
      title: "Senior Product Manager",
      start: "2022-02",
      end: "2023-03",
      achievements: [
        "Activated the company's #1 growth channel via a PLG initiative, and led a UX overhaul that earned industry awards.",
      ],
    },
    {
      id: "upstart-pm",
      org: "Upstart",
      title: "Product Manager",
      start: "2019-07",
      end: "2021-09",
      achievements: [
        "Scaled loan servicing to hundreds of millions in monthly payments. Grew TAM 10% with a Spanish-language loan product.",
      ],
    },
    {
      id: "twitter-pm",
      org: "Twitter",
      title: "Product Manager",
      start: "2018",
      end: "2019",
      achievements: [
        "Built the multi-team roadmap for Business Manager, closing adoption gaps with large brands and agencies.",
      ],
    },
    {
      id: "ampush-senior-pm",
      org: "Ampush",
      title: "Senior Product Manager",
      start: "2013",
      end: "2018",
      achievements: [
        "Launched AMP, a cross-publisher media-buying platform optimizing $300M+ in annual ad spend.",
      ],
    },
  ],
  headlineOutcomes: [
    {
      metric: "2.8×",
      label: "Monetized users",
      org: "Azibo",
      period: "2023—25",
    },
    {
      metric: "$300M+",
      label: "Annual payment volume",
      org: "Azibo",
      period: "2023—25",
    },
    {
      metric: "1→7",
      label: "Products in the suite",
      org: "Azibo",
      period: "2023—25",
      slug: "all-in-one-rental-platform",
    },
    {
      metric: "9%",
      label: "Faster time to lease",
      org: "Evernest",
      period: "2025—26",
      slug: "cutting-six-of-seven-steps",
    },
  ],
});
