import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import ActivityLogClient from './ActivityLogClient';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export default async function ActivityLogPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/es/login');

    // Solo super_admin puede ver esto
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

    if (profile?.role !== 'super_admin') {
        redirect('/es/app/dossiers');
    }

    // Cargar últimas 200 entradas
    const { data: logs } = await supabaseAdmin
        .from('activity_log')
        .select(`
            id,
            event_type,
            payload_json,
            created_at,
            actor_user_id,
            lab_id,
            dossier_id
        `)
        .order('created_at', { ascending: false })
        .limit(200);

    // Obtener labs, dossiers y perfiles para mostrar nombres
    const labIds = [...new Set((logs || []).filter(l => l.lab_id).map(l => l.lab_id))];
    const dossierIds = [...new Set((logs || []).filter(l => l.dossier_id).map(l => l.dossier_id))];
    const actorIds = [...new Set((logs || []).map(l => l.actor_user_id).filter(Boolean))];

    const [{ data: labs }, { data: dossiers }, { data: profiles }] = await Promise.all([
        labIds.length > 0
            ? supabaseAdmin.from('labs').select('id, name').in('id', labIds)
            : Promise.resolve({ data: [] }),
        dossierIds.length > 0
            ? supabaseAdmin.from('dossiers').select('id, product_name').in('id', dossierIds)
            : Promise.resolve({ data: [] }),
        actorIds.length > 0
            ? supabaseAdmin.from('profiles').select('user_id, full_name, email').in('user_id', actorIds)
            : Promise.resolve({ data: [] }),
    ]);

    const labsMap = Object.fromEntries((labs || []).map((l: any) => [l.id, l.name]));
    const dossiersMap = Object.fromEntries((dossiers || []).map((d: any) => [d.id, d.product_name]));
    const profilesMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, { name: p.full_name || p.email, email: p.email }]));

    const enrichedLogs = (logs || []).map(log => ({
        ...log,
        lab_name: log.lab_id ? labsMap[log.lab_id] : null,
        dossier_name: log.dossier_id ? dossiersMap[log.dossier_id] : null,
        payload_json: {
            ...log.payload_json,
            user_name: log.payload_json?.user_name || profilesMap[log.actor_user_id]?.name || 'Usuario',
            user_email: log.payload_json?.user_email || profilesMap[log.actor_user_id]?.email || '',
        }
    }));

    return <ActivityLogClient logs={enrichedLogs} />;
}
