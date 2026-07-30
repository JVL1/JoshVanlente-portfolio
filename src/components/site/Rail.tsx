import Link from "next/link";
import { contactLinks, profile } from "@/data/profile";

type RailProps = {
  children?: React.ReactNode;
};

export function Rail({ children }: RailProps) {
  const [first, ...tail] = profile.name.split(" ");
  const rest = tail.join(" ");

  return (
    <div className="mx-auto grid min-h-screen max-w-[1440px] grid-cols-1 min-[900px]:grid-cols-[330px_minmax(0,1fr)]">
      <header className="border-b border-border px-4 pb-0 pt-8 min-[360px]:px-5 min-[900px]:sticky min-[900px]:top-0 min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:grid min-[900px]:h-screen min-[900px]:grid-rows-[auto_minmax(0,1fr)_9rem] min-[900px]:overflow-y-auto min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:p-11 min-[900px]:px-9">
        <div>
          <p className="text-lg font-bold leading-tight tracking-tight">
            {first}
            {/* A single-word name leaves nothing for the second line, and an
                empty span is a node no test can address. */}
            {rest && <span className="block text-text-muted">{rest}</span>}
          </p>
          <p className="mt-3.5 font-mono text-xs uppercase leading-relaxed tracking-[0.12em] text-text-subtle [overflow-wrap:anywhere]">
            {profile.role}
            <br />
            {profile.disciplines}
          </p>
        </div>

        <nav
          aria-label="Sections"
          className="mt-5 min-[900px]:row-start-2 min-[900px]:mt-0 min-[900px]:self-center"
        >
          <ul className="flex flex-wrap gap-x-[18px] gap-y-2 min-[900px]:flex-col min-[900px]:gap-5">
            {profile.navigation.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="relative flex min-h-11 w-fit items-center gap-0 font-mono text-xs uppercase tracking-[0.12em] text-text-muted transition-[color,gap] duration-200 before:h-px before:w-0 before:bg-accent before:transition-[width] before:duration-200 hover:gap-3 hover:text-text hover:before:w-5 focus-visible:gap-3 focus-visible:text-text focus-visible:before:w-5 min-[900px]:min-h-0"
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main
        id="main"
        tabIndex={-1}
        className="min-w-0 min-[900px]:col-start-2 min-[900px]:row-start-1"
      >
        {children}
      </main>

      <footer className="mt-14 border-t border-text px-4 pb-10 pt-7 min-[360px]:px-5 min-[900px]:sticky min-[900px]:top-[calc(100vh-9rem)] min-[900px]:z-10 min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:mt-0 min-[900px]:self-start min-[900px]:border-r min-[900px]:border-t-0 min-[900px]:bg-bg min-[900px]:px-9 min-[900px]:pb-11 min-[900px]:pt-8">
        <h2 className="mb-3.5 font-mono text-xs uppercase tracking-[0.12em] min-[900px]:sr-only">
          Contact
        </h2>
        <ul className="flex flex-col gap-0.5 font-mono text-xs text-text-subtle min-[900px]:gap-2">
          {contactLinks.map((contact) => (
            <li key={contact.href}>
              <a
                href={contact.href}
                className="inline-flex min-h-11 max-w-full items-center transition-colors duration-200 [overflow-wrap:anywhere] hover:text-text focus-visible:text-text min-[900px]:min-h-0"
              >
                {contact.label}
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
