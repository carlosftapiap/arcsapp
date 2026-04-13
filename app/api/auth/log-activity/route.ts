import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { event_type, lab_id, dossier_id, payload } = body;

        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
        const userAgent = headersList.get('user-agent') || 'unknown';

        // Obtener nombre del usuario para el payload
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', user.id)
            .single();

        await supabaseAdmin.from('activity_log').insert({
            actor_user_id: user.id,
            lab_id: lab_id || null,
            dossier_id: dossier_id || null,
            event_type,
            payload_json: {
                ...payload,
                user_name: profile?.full_name || user.email,
                user_email: profile?.email || user.email,
                ip_address: ip,
                user_agent: userAgent,
            }
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        console.error('Error logging activity:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
