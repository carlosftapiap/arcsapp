import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dossierId = req.nextUrl.searchParams.get('dossierId');
    if (!dossierId) return NextResponse.json({ error: 'Missing dossierId' }, { status: 400 });

    // Usar el RPC get_recent_activity que ya formatea desc_text, stage_code, stage_title, user_name
    // Filtramos por dossier_id después porque el RPC no tiene ese parámetro
    const { data: allActivity, error } = await supabaseAdmin.rpc('get_recent_activity', {
        p_limit: 500,
        p_offset: 0,
        p_lab_id: null
    });

    if (error) {
        // Fallback: query directa si el RPC falla
        const { data: entries, error: err2 } = await supabaseAdmin
            .from('activity_log')
            .select('id, event_type, payload_json, created_at, actor_user_id')
            .eq('dossier_id', dossierId)
            .order('created_at', { ascending: false })
            .limit(100);

        if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });

        // Enriquecer con nombres desde profiles
        const actorIds = [...new Set((entries || []).map((e: any) => e.actor_user_id).filter(Boolean))];
        let profilesMap: Record<string, string> = {};
        if (actorIds.length > 0) {
            const { data: profiles } = await supabaseAdmin
                .from('profiles').select('user_id, full_name, email').in('user_id', actorIds);
            profilesMap = Object.fromEntries(
                (profiles || []).map((p: any) => [p.user_id, p.full_name || p.email || 'Usuario'])
            );
        }
        const fallbackEntries = (entries || []).map((e: any) => ({
            source_id: e.id,
            type: e.event_type,
            desc_text: e.payload_json?.desc_text || '',
            e_id: dossierId,
            e_name: '',
            user_name: e.payload_json?.user_name || profilesMap[e.actor_user_id] || 'Usuario',
            time_at: e.created_at,
            meta: e.payload_json || {},
        }));
        return NextResponse.json({ entries: fallbackEntries });
    }

    // Filtrar solo las entradas del dossier solicitado
    const dossierEntries = (allActivity || []).filter((item: any) => item.e_id === dossierId);

    return NextResponse.json({ entries: dossierEntries });
}
