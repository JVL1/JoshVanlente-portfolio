import Link from "next/link";
import { profile } from "@/data/profile";

const sections = [
  { href: "/#work", label: "Selected work" },
  { href: "/#track", label: "Track record" },
  { href: "/about", label: "About" },
] as const;

export function Rail() {
  const [first, ...tail] = profile.name.split(" ");
  const rest = tail.join(" ");

  return (
    <aside className="sticky top-0 flex h-screen w-[330px] flex-col justify-between overflow-y-auto border-r border-border p-11 px-9">
      <div>
        <p className="text-lg font-bold leading-tight tracking-tight">
          {first}
          <span className="block text-text-muted">{rest}</span>
        </p>
        <p className="mt-3.5 font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-text-subtle">
          {profile.role}
          <br />
          {profile.disciplines}
        </p>
      </div>

      <nav aria-label="Sections">
        <ul className="flex flex-col gap-5">
          {sections.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className="relative flex w-fit items-center gap-0 font-mono text-xs uppercase tracking-[0.12em] text-text-muted transition-[color,gap] duration-200 before:h-px before:w-0 before:bg-accent before:transition-[width] before:duration-200 hover:gap-3 hover:text-text hover:before:w-5 focus-visible:gap-3 focus-visible:text-text focus-visible:before:w-5"
              >
                {section.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <ul className="flex flex-col gap-2 font-mono text-xs text-text-subtle">
        <li>
          <a href={profile.links.linkedin}>LinkedIn</a>
        </li>
        <li>
          <a href={profile.links.github}>GitHub</a>
        </li>
        <li>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
      </ul>
    </aside>
  );
}
