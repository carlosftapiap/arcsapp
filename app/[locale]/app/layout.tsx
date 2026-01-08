import { requireAuth, getUserLabRole, getUserLabs } from '@/lib/supabase/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import { createClient } from '@/lib/supabase/server';

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await requireAuth();

    if (!user) {
        redirect('../login');
    }

    // Obtener rol del usuario
    const supabase = await createClient();
    const { data: labMemberships } = await supabase
        .from('lab_members')
        .select('role, lab_id, labs(name)')
        .eq('user_id', user.id)
        .limit(1)
        .single();

    const userRole = labMemberships?.role || 'lab_viewer';
    const labName = (labMemberships?.labs as any)?.name;

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar userRole={userRole} labName={labName as string} />

            {/* Main Content */}
            <div className="flex-1 ml-64">
                {/* Top Bar */}
                <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                        {/* Lab Name removed to avoid redundancy with page-level selectors */}

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
