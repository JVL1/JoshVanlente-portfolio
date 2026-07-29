import Image from "next/image";
import Link from "next/link";
import type { WorkItem } from "@/lib/content";

export function CaseRow({ item }: { item: WorkItem }) {
  const outcome = item.outcomes[0];

  return (
    <li className="relative grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border py-5 transition-[padding,border-color] duration-300 hover:border-accent hover:pl-4 [&:has(a:focus-visible)]:border-accent [&:has(a:focus-visible)]:pl-4 [&:has(a:focus-visible)_img]:scale-[1.06] [&:has(a:focus-visible)_img]:opacity-100 [&:hover_img]:scale-[1.06] [&:hover_img]:opacity-100 sm:grid-cols-[148px_minmax(0,1fr)_auto] sm:gap-6">
      <div className="aspect-[16/10] overflow-hidden rounded-lg bg-surface">
        <Image
          src={item.cover.src}
          width={item.cover.width}
          height={item.cover.height}
          alt=""
          sizes="(min-width: 640px) 148px, 80px"
          className="h-full w-full object-cover opacity-[0.78] transition-[opacity,transform] duration-300"
        />
      </div>

      <div className="min-w-0 [overflow-wrap:anywhere]">
        <h3 className="text-xl font-semibold tracking-tight transition-colors duration-300">
          <Link
            href={`/work/${item.slug}`}
            className="after:absolute after:inset-0 after:content-[''] hover:text-accent focus-visible:text-accent"
          >
            {item.title}
          </Link>
        </h3>
        <p className="text-base text-text-muted">{item.summary}</p>
        <p data-testid="case-outcome" className="mt-2 text-sm">
          <span className="font-serif text-lg text-text">
            {outcome.metric}
          </span>{" "}
          <span className="text-text-subtle">{outcome.label}</span>
        </p>
        <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.08em] text-text-subtle">
          {item.tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>

      <span className="font-mono text-xs text-text-subtle">
        {item.publishedAt.slice(0, 4)}
      </span>
    </li>
  );
}
