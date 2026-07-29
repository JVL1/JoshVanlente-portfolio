import { CaseRow } from "@/components/site/CaseRow";
import { SectionHeader } from "@/components/site/SectionHeader";
import { getWorkItems } from "@/lib/content";

export default async function WorkIndex() {
  const items = await getWorkItems();

  return (
    <main className="mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24">
      <SectionHeader title="Work" count={items.length} id="work" />
      <ul>
        {items.map((item) => (
          <CaseRow key={item.slug} item={item} />
        ))}
      </ul>
    </main>
  );
}
