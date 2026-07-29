import { z } from "zod";

// Months are range-checked, not just shape-checked: "2025-13" and "2025-00" used
// to parse, and since only the year reaches the rendered output nothing
// downstream would have noticed. This file may import nothing but zod, so the
// pattern is duplicated in src/lib/dates.ts rather than shared — change both.
const dateish = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2]))?$/, "expected YYYY or YYYY-MM");

/**
 * The published role ids. Task 7 writes these into content frontmatter as
 * `roleId`, and Task 6's loader resolves them against `profile.roles[].id`, so a
 * rename here silently orphans a write-up. Listing them makes `Role["id"]` a
 * literal union rather than `string`: renaming one now breaks the build at every
 * consumer, and adding a role forces a deliberate edit here.
 */
export const ROLE_IDS = [
  "evernest-staff-pm",
  "built-principal-pm",
  "azibo-senior-manager",
  "azibo-senior-pm",
  "upstart-pm",
  "twitter-pm",
  "ampush-senior-pm",
] as const;

export type RoleId = (typeof ROLE_IDS)[number];

const roleSchema = z.strictObject({
  id: z.enum(ROLE_IDS),
  org: z.string().min(1),
  title: z.string().min(1),
  start: dateish,
  end: dateish.nullable(),
  achievements: z.array(z.string().min(1)).min(1),
});

/**
 * A rail navigation entry. The rail renders on `/work`, `/about`, and every
 * write-up page, where the homepage's `#work` and `#track` anchors do not
 * exist, so an entry that targets one is written rooted as `/#work` — a bare
 * fragment would resolve against whatever page the reader is already on and go
 * nowhere.
 */
const navigationSchema = z.strictObject({
  href: z.string().min(1),
  label: z.string().min(1),
});

const headlineOutcomeSchema = z.strictObject({
  metric: z.string().min(1),
  label: z.string().min(1),
  org: z.string().min(1),
  period: z.string().min(1),
  slug: z.string().min(1).optional(),
});

const profileSchema = z.strictObject({
  name: z.string().min(1),
  role: z.string().min(1),
  disciplines: z.string().min(1),
  /**
   * The site's default meta description, and so the Google snippet for every
   * page that does not set its own. It is an abridgement of the homepage lede,
   * which lives as JSX in src/app/page.tsx because a phrase inside it is
   * emphasised. Two sentences are shared verbatim between them, and
   * tests/component/home-page.test.tsx asserts both still appear in the rendered
   * lede — so editing the lede without editing this fails loudly rather than
   * silently desyncing what a searcher reads from what the page says.
   */
  metaDescription: z.string().min(1),
  // Zod 4: the top-level z.email()/z.url() replace the deprecated
  // z.string().email() / z.string().url() method forms.
  email: z.email(),
  links: z.strictObject({ linkedin: z.url(), github: z.url() }),
  navigation: z.array(navigationSchema).min(1),
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
  metaDescription:
    "Ten years building 0→1 products and platforms in vertical SaaS and fintech. Currently building an AI agent platform at Evernest.",
  email: "Josh@vanlente.net",
  links: {
    linkedin: "https://www.linkedin.com/in/josh-van-lente/",
    github: "https://github.com/JVL1",
  },
  // The labels here are the same strings the homepage puts on its section
  // headers, and the ids inside the hrefs are the ids those headers carry.
  // Renaming a section on the page without changing it here leaves the rail
  // pointing at an anchor that no longer exists, and nothing fails loudly.
  navigation: [
    { href: "/#work", label: "Selected work" },
    { href: "/#track", label: "Track record" },
    { href: "/about", label: "About" },
  ],
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
      period: "2023—2025",
    },
    {
      metric: "$300M+",
      label: "Annual payment volume",
      org: "Azibo",
      period: "2023—2025",
    },
    {
      metric: "1→7",
      label: "Products in the suite",
      org: "Azibo",
      period: "2023—2025",
      slug: "all-in-one-rental-platform",
    },
    {
      metric: "9%",
      label: "Faster time to lease",
      org: "Evernest",
      period: "2025—2026",
      slug: "cutting-six-of-seven-steps",
    },
  ],
});

/**
 * The rail's contact links, in the order it renders them. Derived from the
 * parsed profile rather than declared alongside it, so each URL is written once
 * and the label that names it cannot drift from the address it points at.
 */
export const contactLinks: ReadonlyArray<{ label: string; href: string }> = [
  { label: "LinkedIn", href: profile.links.linkedin },
  { label: "GitHub", href: profile.links.github },
  { label: profile.email, href: `mailto:${profile.email}` },
];
