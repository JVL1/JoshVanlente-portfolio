import type { Role } from "@/data/profile";
import { formatRoleDates } from "@/lib/dates";

type TrackRecordProps = {
  roles: Role[];
};

export function TrackRecord({ roles }: TrackRecordProps) {
  return (
    <ul>
      {roles.map((role) => (
        <li
          key={role.id}
          // minmax(0,1fr) rather than 1fr: a raw fr track floors at min-content,
          // so a long unbroken string would push the dates column off the row.
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 border-b border-border py-5 min-[900px]:grid-cols-[140px_minmax(0,1fr)_120px] min-[900px]:gap-6"
        >
          <span className="min-w-0 text-lg font-semibold [overflow-wrap:anywhere]">
            {role.org}
          </span>
          <div className="col-span-2 row-start-2 min-w-0 [overflow-wrap:anywhere] min-[900px]:col-span-1 min-[900px]:col-start-2 min-[900px]:row-start-1">
            <p className="text-base text-text-muted">{role.title}</p>
            {role.achievements.map((achievement, index) => (
              <small
                key={`${achievement}-${index}`}
                className="mt-1 block text-sm text-text-subtle"
              >
                {achievement}
              </small>
            ))}
          </div>
          {/* A span, not <time>: formatRoleDates renders ranges like "2023—2025"
              and "2025—now", and <time> has no range form, so six of the seven
              rows would carry a datetime the parser rejects. */}
          <span
            data-testid="role-dates"
            className="col-start-2 row-start-1 text-right font-mono text-xs text-text-subtle min-[900px]:col-start-3"
          >
            {formatRoleDates(role)}
          </span>
        </li>
      ))}
    </ul>
  );
}
