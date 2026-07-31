import Link from "next/link";
import { contactLinks, profile } from "@/data/profile";

type RailProps = {
  children?: React.ReactNode;
};

export function Rail({ children }: RailProps) {
  const [first, ...tail] = profile.name.split(" ");
  const rest = tail.join(" ");

  return (
    <div className="grid min-h-screen grid-cols-1 min-[900px]:grid-cols-[288px_minmax(0,1fr)]">
      <header className="border-b border-border px-4 pb-0 pt-8 min-[360px]:px-5 min-[900px]:sticky min-[900px]:top-0 min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:grid min-[900px]:h-screen min-[900px]:grid-rows-[auto_minmax(0,1fr)_9rem] min-[900px]:overflow-y-auto min-[900px]:border-b-0 min-[900px]:border-r min-[900px]:px-5 min-[900px]:py-11">
        <div>
          <p
            data-testid="profile-name"
            className="whitespace-nowrap text-lg font-bold leading-tight tracking-tight"
          >
            {first}
            {rest && (
              <span className="text-text-muted">{` ${rest}`}</span>
            )}
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
          <ul className="flex w-full flex-nowrap justify-between min-[900px]:flex-col min-[900px]:justify-start min-[900px]:gap-3">
            {profile.navigation.map((section) => (
              <li key={section.href} className="min-[900px]:w-full">
                <Link
                  href={section.href}
                  className="relative flex min-h-11 w-fit items-center gap-0 whitespace-nowrap font-mono text-xs font-bold uppercase tracking-[0.12em] text-text-muted transition-colors duration-200 before:absolute before:bottom-1 before:left-0 before:h-px before:w-0 before:bg-accent before:transition-[width] before:duration-200 hover:text-text hover:before:w-5 focus-visible:text-text focus-visible:before:w-5 min-[360px]:text-sm min-[900px]:min-h-10 min-[900px]:w-full min-[900px]:transition-[color,gap] min-[900px]:before:static min-[900px]:hover:gap-3 min-[900px]:focus-visible:gap-3"
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

      <footer className="mt-14 border-t border-text px-4 pb-10 pt-7 min-[360px]:px-5 min-[900px]:sticky min-[900px]:top-[calc(100vh-9rem)] min-[900px]:z-10 min-[900px]:col-start-1 min-[900px]:row-start-1 min-[900px]:mt-0 min-[900px]:self-start min-[900px]:border-r min-[900px]:border-t-0 min-[900px]:bg-bg min-[900px]:px-5 min-[900px]:pb-11 min-[900px]:pt-8">
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
