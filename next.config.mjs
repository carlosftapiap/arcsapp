/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'untqjhyldlbvviwhmisn.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    allowedDevOrigins: [
        'http://127.0.0.1:65413',
        'http://127.0.0.1:3000',
        'http://localhost:3000',
        '192.168.100.28',
    ],
};

export default withNextIntl(nextConfig);
