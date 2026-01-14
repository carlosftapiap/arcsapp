import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware({
    locales,
    defaultLocale: 'es',
    localePrefix: 'always'
});

export default function middleware(request: NextRequest) {
    // Para Server Actions en desarrollo, sincronizar origin con host
    if (process.env.NODE_ENV === 'development') {
        const origin = request.headers.get('origin');
        const host = request.headers.get('host');
        
        // Si es una Server Action y hay mismatch de origen
        if (origin && host && request.method === 'POST') {
            const requestHeaders = new Headers(request.headers);
            // Forzar que el origin coincida con el host para evitar el error
            requestHeaders.set('x-forwarded-host', new URL(origin).host);
            
            const modifiedRequest = new NextRequest(request.url, {
                method: request.method,
                headers: requestHeaders,
                body: request.body,
                duplex: 'half',
            });
            
            return intlMiddleware(modifiedRequest);
        }
    }
    
    return intlMiddleware(request);
}

export const config = {
    // Match all paths except static files, api routes, and Next.js internals
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
