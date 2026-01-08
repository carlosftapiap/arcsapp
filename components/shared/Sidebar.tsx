'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    Home,
    Building2,
    Users,
    FileText,
    Settings,
    Activity,
    Package,
    FolderOpen,
    ClipboardList,
    BarChart3,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Bot
} from 'lucide-react';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
    userRole: string;
    labName?: string;
}

interface MenuItem {
    name: string;
    href: string;
    icon: any;
    roles: string[];
}

export default function Sidebar({ userRole, labName }: SidebarProps) {
    const t = useTranslations();
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const locale = params?.locale as string || 'es';
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push(`/${locale}/login`);
    };

    const menuItems: MenuItem[] = [
        // Dashboard - Solo para admins
        {
            name: t('nav.dashboard'),
            href: `/${locale}/app`,
            icon: Home,
            roles: ['super_admin', 'lab_admin']
        },

        // Super Admin - Configuración global
        {
            name: t('nav.labs'),
            href: `/${locale}/admin/configuracion/laboratorios`,
            icon: Building2,
            roles: ['super_admin']
        },
        {
            name: t('nav.users'),
            href: `/${locale}/admin/configuracion/usuarios`,
            icon: Users,
            roles: ['super_admin']
        },
        {
            name: t('nav.templates'),
            href: `/${locale}/admin/configuracion/plantillas`,
            icon: ClipboardList,
            roles: ['super_admin']
        },
        {
            name: t('nav.aiPrompts') || 'Prompts IA',
            href: `/${locale}/admin/configuracion/prompts-ia`,
            icon: Bot,
            roles: ['super_admin']
        },
        {
            name: t('nav.audit'),
            href: `/${locale}/admin/logs`,
            icon: Activity,
            roles: ['super_admin']
        },

        // Productos - Solo Lab Admin
        {
            name: t('nav.products'),
            href: `/${locale}/app/productos`,
            icon: Package,
            roles: ['lab_admin']
        },

        // Dossiers - Lab Admin, Uploader, Viewer (esto es lo principal para usuarios de lab)
        {
            name: t('nav.dossiers'),
            href: `/${locale}/app/dossiers`,
            icon: FolderOpen,
            roles: ['lab_admin', 'lab_uploader', 'lab_viewer']
        },

        // Otros Documentos - Solo Lab Admin
        {
            name: t('nav.extraDocs'),
            href: `/${locale}/app/otros-documentos`,
            icon: FileText,
            roles: ['lab_admin']
        },

        // Usuarios del Lab - Solo Lab Admin
        {
            name: t('nav.labUsers'),
            href: `/${locale}/app/usuarios`,
            icon: Users,
            roles: ['lab_admin']
        },

        // Reportes - Solo Lab Admin
        {
            name: t('nav.reports'),
            href: `/${locale}/app/reportes`,
            icon: BarChart3,
            roles: ['lab_admin']
        },

        // Reviewer - Cola de revisión (lo único que ven los revisores externos)
        {
            name: t('nav.reviewQueue'),
            href: `/${locale}/revision/cola`,
            icon: ClipboardList,
            roles: ['reviewer']
        },

        // Settings - Solo admins
        {
            name: t('nav.settings'),
            href: `/${locale}/app/configuracion`,
            icon: Settings,
            roles: ['super_admin', 'lab_admin']
        },
    ];

    const visibleItems = menuItems.filter(item => item.roles.includes(userRole));

    const isActive = (href: string) => {
        if (href === `/${locale}/app`) {
            return pathname === `/${locale}/app`;
        }
        return pathname?.startsWith(href);
    };

    return (
        <aside
            className={`
        fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white 
        transition-all duration-300 ease-in-out z-50 shadow-2xl
        ${collapsed ? 'w-20' : 'w-64'}
      `}
        >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
                {!collapsed && (
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            ARCSAPP
                        </h1>
                        {labName && (
                            <p className="text-xs text-gray-400 truncate">{labName}</p>
                        )}
                    </div>
                )}
                {collapsed && (
                    <div className="w-full flex justify-center">
                        <div className="h-8 w-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-lg"></div>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="mt-4 px-2">
                <ul className="space-y-1">
                    {visibleItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                    flex items-center px-3 py-3 rounded-lg transition-all
                    ${active
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg'
                                            : 'hover:bg-gray-700'
                                        }
                    ${collapsed ? 'justify-center' : 'space-x-3'}
                  `}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <Icon size={20} className={active ? 'text-white' : 'text-gray-300'} />
                                    {!collapsed && (
                                        <span className={`font-medium ${active ? 'text-white' : 'text-gray-300'}`}>
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer */}
            <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 ${collapsed ? 'hidden' : ''}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">Idioma</span>
                    <LanguageSwitcher variant="dark" dropdownDirection="up" />
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
                >
                    <LogOut size={18} />
                    <span>{t('auth.logout')}</span>
                </button>
                <div className="text-xs text-gray-500 text-center">
                    v1.0.0
                </div>
            </div>
        </aside>
    );
}
