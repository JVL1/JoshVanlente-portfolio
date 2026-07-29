import type { Metadata } from "next";
import { SectionHeader } from "@/components/site/SectionHeader";
import { about, aboutMetaDescription } from "@/data/about";

export const metadata: Metadata = {
  title: "About",
  description: aboutMetaDescription,
  // Self-referencing, so the apex, www, and Vercel preview origins the site is
  // reachable at all point at one indexable URL. metadataBase resolves it.
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    // No <main> here: the layout owns it, so the skip link has one target.
    <div className="mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24">
      <div className="max-w-[68ch] text-text">
        <SectionHeader title="About" level={1} />

        <div className="mt-8 space-y-6 text-lg leading-relaxed">
          {about.narrative.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <section
          data-testid="education"
          className="mt-16 border-t border-border pt-8"
        >
          <SectionHeader title="Education" />
          <div className="mt-6 space-y-1">
            <p className="text-base font-semibold">
              {about.education.institution}
            </p>
            {/* Degree and minor share a line, and the minor carries its label.
                Stacked and unlabelled they read as two degrees at equal rank,
                which overstates the credential on a page whose job is
                credibility. This is how Josh wrote it: "B.S. Finance, minor
                Environmental Economics". */}
            <p className="text-sm text-text-muted">
              {about.education.degree}, minor {about.education.minor}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
