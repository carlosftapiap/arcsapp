'use server';

import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function lockDossierItem(itemId: string, lock: boolean) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    // Verificar rol: solo tecnico y super_admin pueden bloquear
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('role, full_name')
        .eq('user_id', user.id)
        .single();

    const canLock = profile?.role === 'super_admin' || profile?.role === 'tecnico';
    const canUnlock = profile?.role === 'super_admin';

    if (!canLock) return { error: 'Sin permisos para bloquear items' };
    if (!lock && !canUnlock) return { error: 'Solo el administrador puede desbloquear items' };

    const { error } = await supabaseAdmin
        .from('dossier_items')
        .update(lock
            ? { locked: true, locked_by: user.id, locked_at: new Date().toISOString() }
            : { locked: false, locked_by: null, locked_at: null }
        )
        .eq('id', itemId);

    if (error) return { error: error.message };
    return { success: true };
}
