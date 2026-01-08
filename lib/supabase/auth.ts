import { createClient } from './server';
import { redirect } from 'next/navigation';

/**
 * Obtiene la sesión actual del usuario
 */
export async function getSession() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}

/**
 * Requiere autenticación, redirige al login si no está autenticado
 */
export async function requireAuth() {
    const user = await getSession();
    if (!user) {
        redirect('/es/login');
    }
    return user;
}

/**
 * Obtiene el rol del usuario en un laboratorio específico
 */
export async function getUserLabRole(userId: string, labId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('lab_members')
        .select('role')
        .eq('user_id', userId)
        .eq('lab_id', labId)
        .single();

    return data?.role || null;
}

/**
 * Verifica si el usuario es super admin
 */
export async function isSuperAdmin(userId: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('lab_members')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'super_admin')
        .single();

    return !!data;
}

/**
 * Verifica si el usuario tiene acceso a un laboratorio específico
 */
export async function hasLabAccess(userId: string, labId: string) {
    // Super admin tiene acceso a todo
    if (await isSuperAdmin(userId)) {
        return true;
    }

    const supabase = await createClient();

    // Verificar si es miembro del lab
    const { data: member } = await supabase
        .from('lab_members')
        .select('id')
        .eq('user_id', userId)
        .eq('lab_id', labId)
        .single();

    if (member) return true;

    // Verificar si es revisor asignado al lab
    const { data: reviewer } = await supabase
        .from('lab_reviewer_assignments')
        .select('id')
        .eq('reviewer_user_id', userId)
        .eq('lab_id', labId)
        .eq('active', true)
        .single();

    return !!reviewer;
}

/**
 * Obtiene todos los laboratorios a los que el usuario tiene acceso
 */
export async function getUserLabs(userId: string) {
    const supabase = await createClient();

    // Si es super admin, obtener todos los labs
    if (await isSuperAdmin(userId)) {
        const { data } = await supabase.from('labs').select('*').order('name');
        return data || [];
    }

    // Obtener labs como miembro
    const { data: memberLabs } = await supabase
        .from('lab_members')
        .select('lab_id, labs(*)')
        .eq('user_id', userId);

    // Obtener labs como revisor
    const { data: reviewerLabs } = await supabase
        .from('lab_reviewer_assignments')
        .select('lab_id, labs(*)')
        .eq('reviewer_user_id', userId)
        .eq('active', true);

    const allLabs = [
        ...(memberLabs?.map((m: any) => m.labs) || []),
        ...(reviewerLabs?.map((r: any) => r.labs) || []),
    ];

    // Eliminar duplicados
    const uniqueLabs = allLabs.filter(
        (lab, index, self) => index === self.findIndex((l) => l.id === lab.id)
    );

    return uniqueLabs;
}
