import { profile } from "@/data/profile";

const MAX_TITLE_LENGTH = 120;
const fallbackTitle = `${profile.name} — ${profile.role}`;

export function normalizeOgTitle(title: string | null | undefined): string {
  const normalized = title?.trim() ? title : fallbackTitle;

  return normalized.length > MAX_TITLE_LENGTH
    ? `${normalized.slice(0, MAX_TITLE_LENGTH - 1)}…`
    : normalized;
}
