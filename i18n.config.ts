import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en'] as const;
export type Locale = typeof locales[number];

export const defaultLocale = 'en' as const;
export const localePrefix = 'always' as const; // "as-needed" | "always" | "never"

export function getLocales() {
  return locales;
}

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  return {
    messages: (await import(`./src/messages/${locale}.json`)).default
  };
}); 