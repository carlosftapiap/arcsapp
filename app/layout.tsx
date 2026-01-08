import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'ARCSAPP - Gestión de Dossiers Regulatorios',
    description: 'Sistema multi-tenant para gestión de expedientes regulatorios con análisis IA',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
