import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Building2, Package, FolderOpen, Users, ClipboardList, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/supabase/auth';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const t = await getTranslations();
    const { locale } = await params;

    // Obtener usuario y rol
    const user = await requireAuth();
    if (!user) {
        redirect(`/${locale}/login`);
    }

    const supabase = await createClient();
    const { data: labMembership } = await supabase
        .from('lab_members')
        .select('role')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    const userRole = labMembership?.role || 'lab_viewer';

    // Redirigir usuarios con roles limitados a su página correspondiente
    if (userRole === 'lab_uploader' || userRole === 'lab_viewer') {
        redirect(`/${locale}/app/dossiers`);
    }
    if (userRole === 'reviewer') {
        redirect(`/${locale}/revision/cola`);
    }

    const cards = [
        {
            title: t('nav.labs'),
            description: 'Gestionar laboratorios',
            icon: Building2,
            href: `/${locale}/admin/configuracion/laboratorios`,
            color: 'from-purple-500 to-pink-500',
            roles: ['super_admin']
        },
        {
            title: t('nav.products'),
            description: 'Gestionar productos',
            icon: Package,
            href: `/${locale}/app/productos`,
            color: 'from-blue-500 to-cyan-500',
            roles: ['super_admin', 'lab_admin']
        },
        {
            title: t('nav.dossiers'),
            description: 'Gestionar dossiers',
            icon: FolderOpen,
            href: `/${locale}/app/dossiers`,
            color: 'from-green-500 to-emerald-500',
            roles: ['super_admin', 'lab_admin']
        },
        {
            title: t('nav.templates'),
            description: 'Plantillas de checklist',
            icon: ClipboardList,
            href: `/${locale}/admin/configuracion/plantillas`,
            color: 'from-orange-500 to-red-500',
            roles: ['super_admin']
        },
        {
            title: t('nav.users'),
            description: 'Gestionar usuarios',
            icon: Users,
            href: `/${locale}/admin/configuracion/usuarios`,
            color: 'from-indigo-500 to-purple-500',
            roles: ['super_admin']
        },
        {
            title: t('nav.settings'),
            description: 'Configuración',
            icon: Settings,
            href: `/${locale}/app/configuracion`,
            color: 'from-gray-500 to-slate-500',
            roles: ['super_admin', 'lab_admin']
        },
    ];

    // Filtrar cards según el rol del usuario
    const visibleCards = cards.filter(card => card.roles.includes(userRole));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('nav.dashboard')}</h1>
                <p className="text-gray-600 mt-1">Bienvenido a ARCSAPP</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="card hover-lift cursor-pointer group"
                        >
                            <div className="flex items-start space-x-4">
                                <div className={`h-12 w-12 bg-gradient-to-r ${card.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    <Icon size={24} className="text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">🚀 Primeros Pasos</h3>
                <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Crea un laboratorio desde la sección "Laboratorios"</li>
                    <li>Crea productos para ese laboratorio</li>
                    <li>Genera dossiers desde los productos</li>
                    <li>Sube documentos al checklist del dossier</li>
                </ol>
            </div>
        </div>
    );
}
