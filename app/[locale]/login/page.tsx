'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';

export default function LoginPage() {
    const t = useTranslations('auth');
    const t_common = useTranslations('common');
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setLoading(false);
                return;
            }

            if (data.user) {
                // Redirigir según el rol
                router.push('./app');
                router.refresh();
            }
        } catch (err) {
            setError('Error de conexión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative">
            {/* Language Switcher - Top Right */}
            <div className="absolute top-4 right-4 z-10">
                <LanguageSwitcher />
            </div>

            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
                {/* Logo y título */}
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center mb-4">
                        <img
                            src="/logo-arcsapp.png"
                            alt="ARCSAPP - Evolución y Salud"
                            className="h-24 w-auto object-contain"
                        />
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                        ARCSAPP
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">{t('welcome')}</p>
                </div>

                {/* Formulario */}
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="label">
                                {t('email')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="input"
                                placeholder="usuario@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="label">
                                {t('password')}
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center items-center btn-primary py-3 text-base font-semibold"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner mr-2"></div>
                                    {t_common('loading')}
                                </>
                            ) : (
                                t('login')
                            )}
                        </button>
                    </div>

                    {/* Información de la aplicación */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-xs text-blue-700 text-center">
                            {t('description')}
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
