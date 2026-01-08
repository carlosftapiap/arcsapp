import { createClient } from '@/lib/supabase/server';
import DossiersClient from './DossiersClient';

export default async function DossiersPage() {
    const supabase = await createClient();

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener perfil y rol del usuario
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
    
    console.log('🔍 Profile query result:', { profile, profileError, userId: user.id });

    const userRole = profile?.role || 'viewer';
    const isGlobalReviewer = userRole === 'reviewer' || userRole === 'super_admin';

    // 1. Obtener laboratorios disponibles
    let availableLabs;
    let labsWithDossierCounts: { id: string; name: string; dossier_count: number; pending_review: number }[] = [];

    if (isGlobalReviewer) {
        // Revisor global o super_admin: puede ver TODOS los labs activos
        const { data } = await supabase
            .from('labs')
            .select('id, name')
            .eq('status', 'active')
            .order('name');
        availableLabs = data;

        // Obtener conteo de dossiers por laboratorio para el dashboard del revisor
        if (availableLabs && availableLabs.length > 0) {
            const labIds = availableLabs.map(l => l.id);
            
            // Obtener todos los dossiers de los labs
            const { data: allDossiers } = await supabase
                .from('dossiers')
                .select('id, lab_id, status')
                .in('lab_id', labIds);

            // Calcular conteos por lab
            labsWithDossierCounts = availableLabs.map(lab => {
                const labDossiers = allDossiers?.filter(d => d.lab_id === lab.id) || [];
                const pendingReview = labDossiers.filter(d => 
                    d.status === 'in_progress' || d.status === 'uploaded' || d.status === 'draft'
                ).length;
                return {
                    id: lab.id,
                    name: lab.name,
                    dossier_count: labDossiers.length,
                    pending_review: pendingReview
                };
            }).filter(lab => lab.dossier_count > 0); // Solo mostrar labs con dossiers
        }
    } else {
        // Usuario normal: solo labs a los que está asignado via lab_members
        const { data: memberships } = await supabase
            .from('lab_members')
            .select('lab_id')
            .eq('user_id', user.id);

        const labIds = memberships?.map(m => m.lab_id) || [];

        if (labIds.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-500">No tienes acceso a ningún laboratorio activo.</p>
                </div>
            );
        }

        const { data } = await supabase
            .from('labs')
            .select('id, name')
            .in('id', labIds)
            .eq('status', 'active')
            .order('name');
        availableLabs = data;
    }

    if (!availableLabs || availableLabs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No hay laboratorios activos disponibles.</p>
            </div>
        );
    }

    // Por defecto seleccionamos el primero
    const initialLabId = availableLabs[0].id;

    // 2. Cargar Dossiers del laboratorio inicial
    const { data: dossiers } = await supabase
        .from('dossiers')
        .select('*')
        .eq('lab_id', initialLabId)
        .order('created_at', { ascending: false });

    // 3. Cargar Productos del laboratorio inicial
    const { data: products } = await supabase
        .from('products')
        .select('id, nombre_comercial, product_type, principio_activo')
        .eq('lab_id', initialLabId)
        .order('nombre_comercial');

    return (
        <DossiersClient
            initialDossiers={dossiers || []}
            initialProducts={products || []}
            availableLabs={availableLabs}
            initialLabId={initialLabId}
            userRole={userRole}
            labsDashboard={labsWithDossierCounts}
        />
    );
}
