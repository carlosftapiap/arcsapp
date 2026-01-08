import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    // Verificar que el locale es válido
    if (!locales.includes(locale as any)) {
        notFound();
    }

    // Obtener mensajes de traducción
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}

export function generateStaticParams() {
    return locales.map((locale) => ({ locale }));
}
