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

    // Solo super_admin puede ver logins
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
    if (profile?.role !== 'super_admin') return NextResponse.json({ entries: [] });

    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    const { data: entries } = await supabaseAdmin
        .from('activity_log')
        .select('id, event_type, payload_json, created_at, actor_user_id')
        .in('event_type', ['user_login', 'user_logout'])
        .order('created_at', { ascending: false })
        .limit(limit);

    // Enriquecer con nombres desde profiles
    const actorIds = [...new Set((entries || []).map(e => e.actor_user_id).filter(Boolean))];
    let profilesMap: Record<string, string> = {};
    if (actorIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('user_id, full_name, email')
            .in('user_id', actorIds);
        profilesMap = Object.fromEntries(
            (profiles || []).map((p: any) => [p.user_id, p.full_name || p.email || 'Usuario'])
        );
    }

    const enriched = (entries || []).map(e => ({
        ...e,
        payload_json: {
            ...e.payload_json,
            user_name: e.payload_json?.user_name || profilesMap[e.actor_user_id] || 'Usuario',
        }
    }));

    return NextResponse.json({ entries: enriched });
}
