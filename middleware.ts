import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
    locales,
    defaultLocale: 'es',
    localePrefix: 'always'
});

export const config = {
    // Match all paths except static files, api routes, and Next.js internals
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
