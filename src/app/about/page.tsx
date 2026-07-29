import type { Metadata } from "next";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "Josh Van Lente is an experienced product leader whose work spans fintech, proptech, and adtech.",
  // Self-referencing, so the apex, www, and Vercel preview origins the site is
  // reachable at all point at one indexable URL. metadataBase resolves it.
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    // No <main> here: the layout owns it, so the skip link has one target.
    <div className="mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24">
      <div className="max-w-[68ch] text-text">
        <h1 className="font-mono text-xs uppercase tracking-[0.2em]">About</h1>

        <div className="mt-8 space-y-6 text-lg leading-relaxed">
          {about.narrative.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <section
          data-testid="education"
          className="mt-16 border-t border-border pt-8"
        >
          <h2 className="font-mono text-xs uppercase tracking-[0.2em]">
            Education
          </h2>
          <div className="mt-6 space-y-1">
            <p className="text-base font-semibold">
              {about.education.institution}
            </p>
            <p className="text-sm text-text-muted">{about.education.degree}</p>
            <p className="text-sm text-text-muted">{about.education.minor}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
