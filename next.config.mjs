/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'untqjhyldlbvviwhmisn.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    skipMiddlewareUrlNormalize: true,
    skipTrailingSlashRedirect: true,
    experimental: {
        serverActions: {
            allowedOrigins: [
                'localhost:3000',
                'localhost',
                '127.0.0.1:3000',
                '127.0.0.1',
                '192.168.100.28:3000',
                '192.168.100.28',
                'arcsa.evophar.com',
                'www.arcsa.evophar.com',
            ],
            bodySizeLimit: '50mb',
        },
    },
};

export default withNextIntl(nextConfig);
