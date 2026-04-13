'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function getAssignmentsForDossier(dossierId: string) {
    // 1. Obtener asignaciones
    const { data: assignments, error } = await supabaseAdmin
        .from('dossier_technician_assignments')
        .select('id, user_id, assigned_at')
        .eq('dossier_id', dossierId)
        .eq('active', true)
        .order('assigned_at', { ascending: false });

    if (error) console.error('getAssignments error:', error);
    if (!assignments || assignments.length === 0) return [];

    // 2. Obtener perfiles de los usuarios asignados por separado
    const userIds = assignments.map(a => a.user_id);
    const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    return assignments.map(a => ({
        id: a.id,
        user_id: a.user_id,
        assigned_at: a.assigned_at,
        profiles: profileMap.get(a.user_id) || { full_name: 'Sin nombre', email: '' },
    }));
}

export async function getTecnicosAvailable(excludeUserIds: string[]) {
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('role', 'tecnico')
        .order('full_name');

    if (error) console.error('getTecnicos error:', error);
    const all = (data || []) as { user_id: string; full_name: string; email: string }[];
    return all.filter(u => !excludeUserIds.includes(u.user_id));
}

export async function assignTechnicianToDossier(dossierId: string, userId: string, assignedBy: string) {
    console.log('🔧 assignTechnicianToDossier called:', { dossierId, userId, assignedBy });
    const { data, error } = await supabaseAdmin
        .from('dossier_technician_assignments')
        .upsert(
            { dossier_id: dossierId, user_id: userId, assigned_by: assignedBy, active: true },
            { onConflict: 'dossier_id,user_id' }
        )
        .select();

    console.log('🔧 assignTechnicianToDossier result:', { data, error });
    if (error) return { error: error.message };
    return { error: null };
}

export async function unassignTechnicianFromDossier(dossierId: string, userId: string) {
    const { error } = await supabaseAdmin
        .from('dossier_technician_assignments')
        .update({ active: false })
        .eq('dossier_id', dossierId)
        .eq('user_id', userId);

    if (error) return { error: error.message };
    return { error: null };
}
