import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
    return handleSignOut();
}

export async function POST() {
    return handleSignOut();
}

async function handleSignOut() {
    const supabase = await createClient();

    // Registrar logout antes de cerrar sesión
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const headersList = await headers();
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, email')
            .eq('user_id', user.id)
            .single();

        try {
            await supabaseAdmin.from('activity_log').insert({
                actor_user_id: user.id,
                event_type: 'user_logout',
                payload_json: {
                    user_name: profile?.full_name || user.email,
                    user_email: profile?.email || user.email,
                    ip_address: ip,
                }
            });
        } catch {}
    }

    await supabase.auth.signOut();

    // Clear cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    allCookies.forEach(cookie => {
        cookieStore.delete(cookie.name);
    });

    return NextResponse.redirect(new URL('/es/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'));
}
