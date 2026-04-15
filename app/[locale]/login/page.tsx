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
                // Registrar login en activity_log (fire & forget)
                fetch('/api/auth/log-activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event_type: 'user_login',
                        payload: { email: data.user.email }
                    })
                }).catch(() => {});

                router.push('./app');
                router.refresh();
            }
        } catch (err) {
            setError('Error de conexión');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #203f90 70%, #1a1040 100%)' }}>

            {/* Círculos decorativos de fondo */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
                <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, #818cf8, transparent)' }} />
                <div className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #34d399, transparent)' }} />
                <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #f472b6, transparent)' }} />
                {/* Grid sutil */}
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            {/* Franja Superior Branding */}
            <div className="w-full bg-white/10 backdrop-blur-sm text-white py-5 text-center border-b border-white/10 relative z-10">
                <h1 className="text-3xl font-bold tracking-widest text-white drop-shadow">ARCSAPP</h1>
                <p className="mt-1 text-sm font-medium text-blue-200">Sistema de Gestión Documental</p>
                {/* Language Switcher - Top Right */}
                <div className="absolute top-1/2 -translate-y-1/2 right-4 z-10">
                    <LanguageSwitcher />
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 relative z-10">
                <div className="max-w-md w-full space-y-8 p-10 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.95)' }}>
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
                    <div className="mt-6 p-4 rounded-xl border border-indigo-100" style={{ background: 'linear-gradient(135deg, #eff6ff, #eef2ff)' }}>
                        <p className="text-xs text-indigo-700 text-center">
                            {t('description')}
                        </p>
                    </div>
                </form>
            </div>
            </div>
        </div>
    );
}
