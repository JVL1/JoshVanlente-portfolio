import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale, localePrefix } from './i18n.config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix
});

export const config = {
  matcher: [
    // Match all pathnames except for
    // - … if they start with
    //   - api (API routes)
    //   - _next (Next.js internals)
    //   - _vercel (Vercel internals)
    //   - .*\\. (files with an extension)
    '/((?!api|_next|_vercel|.*\\.).*)',
    // However, match all pathnames within /api, except for
    // - … if they start with
    //   - _next (Next.js internals)
    //   - _vercel (Vercel internals)
    //   - .*\\. (files with an extension)
    '/api/(?!_next|_vercel|.*\\.).*'
  ]
}; 