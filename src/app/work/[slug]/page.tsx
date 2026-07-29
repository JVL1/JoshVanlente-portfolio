import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXContent } from "@/components/mdx/MDXContent";
import { Prose } from "@/components/site/Prose";
import { getAllWorkSlugs, getWorkItem } from "@/lib/content";

export async function generateStaticParams() {
  return (await getAllWorkSlugs()).map((slug) => ({ slug }));
}

export default async function WorkItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getWorkItem(slug);

  if (!item) notFound();

  return (
    // No <main> here: the layout owns it, so a skip link has one element to
    // target on every route.
    <div className="mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24">
      <header className="max-w-[68ch]">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-text-subtle">
          {item.org} · {item.timeframe}
        </p>
        <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-text">
          {item.title}
        </h1>
        <p className="mt-3 text-md text-text-muted">{item.role}</p>
      </header>

      <dl className="mt-10 grid gap-px border-y border-border bg-border sm:auto-cols-fr sm:grid-flow-col">
        {item.outcomes.map((outcome) => (
          <div
            key={`${outcome.metric}-${outcome.label}`}
            // The row only exists at sm:, so the edge-trimming has to wait for
            // it too — unprefixed, it stripped the padding from the first and
            // last cards while they were still stacked.
            className="bg-bg px-4 py-6 sm:px-6 sm:first:pl-0 sm:last:pr-0"
          >
            <dt className="font-mono text-xs uppercase tracking-[0.08em] text-text-muted">
              {outcome.label}
            </dt>
            <dd className="mt-2 font-serif text-xl text-text">
              {outcome.metric}
            </dd>
          </div>
        ))}
      </dl>

      {/* alt="" because the <h1> two blocks up already says what the cover
          shows; repeating it makes a screen reader read the title twice.
          The sizes list traces the container: max-w-[75rem] is border-box and
          the horizontal padding is 2rem below sm: and 4rem from sm: up, so the
          image is 71rem once the container caps out, and 100vw minus that
          padding until then. */}
      <Image
        className="mt-12 h-auto w-full rounded-lg"
        src={item.cover}
        alt=""
        sizes="(min-width: 75rem) 71rem, (min-width: 40rem) calc(100vw - 4rem), calc(100vw - 2rem)"
        priority
      />

      <div className="mt-16">
        <Prose>
          <MDXContent code={item.code} />
        </Prose>
      </div>
    </div>
  );
}
