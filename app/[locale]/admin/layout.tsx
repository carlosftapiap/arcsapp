import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect(`/${locale}/login`);
    }

    // Obtener rol del usuario
    const { data: labMemberships } = await supabase
        .from('lab_members')
        .select('role, lab_id, labs(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    const userRole = labMemberships?.role || 'lab_viewer';
    const labName = (labMemberships?.labs as any)?.name;

    // Verificar si es super admin (opcional, pero buena práctica para rutas admin)
    // Por ahora solo aseguramos que tenga acceso al sidebar

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar userRole={userRole} labName={labName as string} />

            {/* Main Content */}
            <div className="flex-1 ml-64">
                {/* Top Bar */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Administración - {labName || 'ARCSAPP'}
                        </h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-700">{user.email}</span>
                        <a
                            href="/api/auth/signout"
                            className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
                        >
                            Cerrar Sesión
                        </a>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
