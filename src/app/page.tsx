import { CaseRow } from "@/components/site/CaseRow";
import { MetricStrip } from "@/components/site/MetricStrip";
import { SectionHeader } from "@/components/site/SectionHeader";
import { TrackRecord } from "@/components/site/TrackRecord";
import { profile } from "@/data/profile";
import { getHeadlineOutcomes, getRoles, getWorkItems } from "@/lib/content";

export default async function Home() {
  const [outcomes, items, roles] = await Promise.all([
    getHeadlineOutcomes(),
    getWorkItems(),
    getRoles(),
  ]);

  return (
    // No <main> here: the layout owns it, so the skip link has one target.
    <div className="mx-auto w-full max-w-[75rem] px-4 py-12 sm:px-8 sm:py-14">
      <section className="pb-12">
        <h1 className="max-w-[19ch] text-[clamp(38px,5.2vw,68px)] font-bold leading-none tracking-[-0.045em]">
          I find the bet worth making, then earn the right to{" "}
          <em className="font-serif font-normal italic tracking-[-0.015em] text-accent">
            finish it
          </em>
          .
        </h1>
        <p
          data-testid="lede"
          className="mt-6 max-w-[74ch] text-lg leading-relaxed text-text-muted"
        >
          Ten years building 0→1 products and platforms in vertical SaaS and
          fintech. Mostly that means research, collaboration, and working out
          when a bet is actually worth making — then shipping proof along the
          way that earns the next step. Currently building{" "}
          <strong className="font-semibold text-text">
            an AI agent platform
          </strong>{" "}
          at Evernest.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href={`mailto:${profile.email}`}
            className="rounded-full bg-accent px-[18px] py-2.5 text-base font-semibold text-bg"
          >
            Email me
          </a>
          <a
            href={profile.links.linkedin}
            className="rounded-full border border-border-cta px-[18px] py-2.5 text-base font-semibold text-text"
          >
            LinkedIn ↗
          </a>
        </div>
      </section>

      <section>
        <SectionHeader title="Selected outcomes" count={outcomes.length} />
        <MetricStrip outcomes={outcomes} />
      </section>

      <section className="mt-12">
        <SectionHeader title="Selected work" count={items.length} id="work" />
        <ul>
          {items.map((item) => (
            <CaseRow key={item.slug} item={item} />
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <SectionHeader title="Track record" count={roles.length} id="track" />
        <TrackRecord roles={roles} />
      </section>
    </div>
  );
}
