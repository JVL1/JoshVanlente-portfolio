import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
 
export default createMiddleware(routing);
 
export const config = {
  matcher: [
      // Match all pathnames except for
      // - … if they start with
      //   - api (API routes)
      //   - _next (Next.js internals)
      //   - _vercel (Vercel internals)
      //   - .*\\. (files with an extension)
      '/((?!api|_next|_vercel|.*\\..*).*)'
    ]
};