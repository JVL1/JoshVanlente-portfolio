import Link from "next/link";

export default function NotFound() {
  return (
    // No <main> here: the layout owns it, so a skip link has one element to
    // target on every route.
    <div className="mx-auto flex min-h-screen w-full max-w-[75rem] items-center px-4 py-16 sm:px-8">
      <div className="max-w-[68ch]">
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-text">
          Page not found.
        </h1>
        <p className="mt-3 text-md text-text-muted">
          The page may have moved, or the address may be incorrect.
        </p>
        <Link
          href="/work"
          className="mt-8 inline-flex min-h-11 items-center rounded-full border border-border-cta px-5 py-2 text-sm font-medium text-text transition-colors hover:border-border-strong hover:text-accent"
        >
          Back to work
        </Link>
      </div>
    </div>
  );
}
