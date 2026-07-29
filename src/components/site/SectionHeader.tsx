type SectionHeaderProps = {
  title: string;
  count: number;
  id?: string;
};

export function SectionHeader({ title, count, id }: SectionHeaderProps) {
  return (
    <header
      id={id}
      className="flex items-center justify-between border-b border-text pb-3 font-mono text-xs uppercase tracking-[0.2em]"
    >
      <h2>{title}</h2>
      <span aria-label={`${count} items`}>
        {String(count).padStart(2, "0")}
      </span>
    </header>
  );
}
