import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getUserAssignedDossierIds } from '@/lib/supabase/auth';
import DossiersClient from './DossiersClient';
import TecnicoDossiersClient from './TecnicoDossiersClient';

export default async function DossiersPage() {
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener perfil y rol del usuario
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    const userRole = profile?.role || 'viewer';
    const isTecnico = userRole === 'tecnico';

    // ── TÉCNICO: vista simplificada con todos sus dossiers asignados ──
    if (isTecnico) {
        const assignedIds = await getUserAssignedDossierIds(user.id);

        if (assignedIds.length === 0) {
            return (
                <div className="text-center py-12">
                    <p className="text-gray-500">No tienes dossiers asignados aún. Contacta al administrador.</p>
                </div>
            );
        }

        // Cargar todos los dossiers asignados (de cualquier lab) con admin client
        const { data: allAssignedDossiers } = await supabaseAdmin
            .from('dossiers')
            .select('*')
            .in('id', assignedIds)
            .order('created_at', { ascending: false });

        // Obtener nombres de labs para mostrar en cada card
        const uniqueLabIds = [...new Set((allAssignedDossiers || []).map((d: any) => d.lab_id))];
        const { data: labsData } = await supabaseAdmin
            .from('labs')
            .select('id, name')
            .in('id', uniqueLabIds);

        const labsMap = new Map((labsData || []).map((l: any) => [l.id, l.name]));

        const dossiersWithLabName = (allAssignedDossiers || []).map((d: any) => ({
            ...d,
            lab_name: labsMap.get(d.lab_id) || '',
        }));

        return (
            <TecnicoDossiersClient
                dossiers={dossiersWithLabName}
                userId={user.id}
            />
        );
    }

    // ── RESTO DE ROLES ──
    let availableLabs: { id: string; name: string }[] = [];
    let labsWithDossierCounts: { id: string; name: string; dossier_count: number; pending_review: number }[] = [];

    if (userRole === 'super_admin' || userRole === 'reviewer') {
        const { data } = await supabase
            .from('labs')
            .select('id, name')
            .eq('status', 'active')
            .order('name');
        availableLabs = data || [];

        if (availableLabs.length > 0) {
            const labIds = availableLabs.map(l => l.id);
            const { data: allDossiers } = await supabase
                .from('dossiers')
                .select('id, lab_id, status')
                .in('lab_id', labIds);

            labsWithDossierCounts = availableLabs.map(lab => {
                const labDossiers = allDossiers?.filter(d => d.lab_id === lab.id) || [];
                const pendingReview = labDossiers.filter(d =>
                    d.status === 'in_progress' || d.status === 'uploaded' || d.status === 'draft'
                ).length;
                return { id: lab.id, name: lab.name, dossier_count: labDossiers.length, pending_review: pendingReview };
            }).filter(lab => lab.dossier_count > 0);
        }

    } else {
        // Usuario de laboratorio: labs asignados via lab_members
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
        availableLabs = data || [];
    }

    if (!availableLabs || availableLabs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No hay laboratorios disponibles.</p>
            </div>
        );
    }

    const initialLabId = availableLabs[0].id;

    let dossiersQuery = supabase
        .from('dossiers')
        .select('*')
        .eq('lab_id', initialLabId)
        .order('created_at', { ascending: false });

    if (userRole === 'reviewer') {
        const assignedIds = await getUserAssignedDossierIds(user.id);
        if (assignedIds.length === 0) {
            return (
                <DossiersClient
                    initialDossiers={[]}
                    initialProducts={[]}
                    availableLabs={availableLabs}
                    initialLabId={initialLabId}
                    userRole={userRole}
                    userId={user.id}
                    labsDashboard={labsWithDossierCounts}
                />
            );
        }
        dossiersQuery = dossiersQuery.in('id', assignedIds);
    }

    let dossiers: any[] = (await dossiersQuery).data || [];

    // Enriquecer dossiers con técnicos asignados (solo para superadmin)
    if (userRole === 'super_admin' && dossiers.length > 0) {
        const dossierIds = dossiers.map(d => d.id);
        const { data: techAssignments } = await supabase
            .from('dossier_technician_assignments')
            .select('dossier_id, user_id')
            .in('dossier_id', dossierIds)
            .eq('active', true);

        if (techAssignments && techAssignments.length > 0) {
            const assignedUserIds = [...new Set((techAssignments as any[]).map(a => a.user_id))];
            const { data: techProfiles } = await supabase
                .from('profiles')
                .select('user_id, full_name')
                .in('user_id', assignedUserIds);

            const profileMap = new Map((techProfiles || []).map((p: any) => [p.user_id, p.full_name]));

            dossiers = dossiers.map(d => ({
                ...d,
                assignedTechnicians: (techAssignments as any[])
                    .filter(a => a.dossier_id === d.id)
                    .map(a => ({ user_id: a.user_id, full_name: profileMap.get(a.user_id) || '' }))
            }));
        }
    }

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
            userId={user.id}
            labsDashboard={labsWithDossierCounts}
        />
    );
}
