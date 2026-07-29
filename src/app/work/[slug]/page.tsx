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
    <main className="mx-auto w-full max-w-[75rem] px-4 py-16 sm:px-8 sm:py-24">
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
            className="bg-bg px-4 py-6 first:pl-0 last:pr-0 sm:px-6"
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

      <Image
        className="mt-12 h-auto w-full rounded-lg"
        src={item.cover}
        alt={item.title}
        sizes="(min-width: 80rem) 75rem, calc(100vw - 2rem)"
        priority
      />

      <div className="mt-16">
        <Prose>
          <MDXContent code={item.code} />
        </Prose>
      </div>
    </main>
  );
}
