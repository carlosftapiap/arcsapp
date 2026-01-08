import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';

export const locales = ['es', 'en', 'hi', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ requestLocale }) => {
    // Get locale from parameter or headers
    let locale = await requestLocale;

    // Fallback to 'es' if no locale provided
    if (!locale) {
        const headersList = await headers();
        locale = headersList.get('x-next-intl-locale') || 'es';
    }

    // Validate that the incoming `locale` parameter is valid
    if (!locales.includes(locale as Locale)) notFound();

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default,
    };
});
