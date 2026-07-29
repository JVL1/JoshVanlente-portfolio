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
          className="grid grid-cols-[140px_1fr_120px] items-baseline gap-6 border-b border-border py-5"
        >
          <span className="text-lg font-semibold">{role.org}</span>
          <div>
            <p className="text-base text-text-muted">{role.title}</p>
            {role.achievements.map((achievement) => (
              <small
                key={achievement}
                className="mt-1 block text-sm text-text-subtle"
              >
                {achievement}
              </small>
            ))}
          </div>
          <time className="text-right font-mono text-xs text-text-subtle">
            {formatRoleDates(role)}
          </time>
        </li>
      ))}
    </ul>
  );
}
