import type { Metadata } from "next";
import { CaseRow } from "@/components/site/CaseRow";
import { SectionHeader } from "@/components/site/SectionHeader";
import { profile } from "@/data/profile";
import { getWorkItems } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  // Composed from profile.name rather than spelling it out, so this index says
  // whose work it is from the same source as every other page.
  description: `Case-study write-ups from ${profile.name}'s product work.`,
  // Self-referencing, so the apex, www, and Vercel preview origins the site is
  // reachable at all point at one indexable URL. metadataBase resolves it.
  alternates: { canonical: "/work" },
};

export default async function WorkIndex() {
  const items = await getWorkItems();

  return (
    // No <main> here: the layout owns it, so a skip link has one element to
    // target on every route.
    <div className="mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24">
      <SectionHeader title="Work" count={items.length} id="work" level={1} />
      <ul>
        {items.map((item) => (
          <CaseRow key={item.slug} item={item} level={2} />
        ))}
      </ul>
    </div>
  );
}
