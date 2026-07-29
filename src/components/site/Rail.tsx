import Link from "next/link";
import { contactLinks, profile } from "@/data/profile";

export function Rail() {
  const [first, ...tail] = profile.name.split(" ");
  const rest = tail.join(" ");

  return (
    // The width comes from the shell's 330px grid track, not from here. Setting
    // it twice would hold the rail at 330px when Task 19 collapses the column.
    // overflow-y-auto is load-bearing: the rail is 100vh with space-between, so
    // below roughly 420px of viewport height the contact links clip unreachably.
    <aside className="sticky top-0 flex h-screen flex-col justify-between overflow-y-auto border-r border-border p-11 px-9">
      <div>
        <p className="text-lg font-bold leading-tight tracking-tight">
          {first}
          {/* A single-word name leaves nothing for the second line, and an empty
              span is a node no test can address. */}
          {rest && <span className="block text-text-muted">{rest}</span>}
        </p>
        <p className="mt-3.5 font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-text-subtle">
          {profile.role}
          <br />
          {profile.disciplines}
        </p>
      </div>

      <nav aria-label="Sections">
        <ul className="flex flex-col gap-5">
          {profile.navigation.map((section) => (
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
        {contactLinks.map((contact) => (
          <li key={contact.href}>
            {/* These sit at text-subtle directly beneath a paragraph in the same
                colour and font, so without a hover they read as body text. */}
            <a
              href={contact.href}
              className="transition-colors duration-200 hover:text-text focus-visible:text-text"
            >
              {contact.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
