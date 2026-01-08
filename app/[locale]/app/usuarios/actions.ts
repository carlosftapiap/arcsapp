'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Nota: Necesitamos usar la Service Role Key para crear usuarios sin cerrar sesión.
// Asegúrate de que SUPABASE_SERVICE_ROLE_KEY esté en tu .env
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function createUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const labId = formData.get('labId') as string;
    const role = formData.get('role') as string;

    if (!email || !password || !fullName) {
        return { error: 'Faltan campos obligatorios' };
    }

    try {
        // 1. Crear usuario en Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("No se pudo crear el usuario");

        const userId = authData.user.id;

        // 2. Crear entrada en Profiles (OBLIGATORIO - debe completarse antes de lab_members)
        // NOTA: La columna es user_id, no id (según el schema)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                user_id: userId,
                email: email,
                full_name: fullName,
                updated_at: new Date().toISOString()
            });

        if (profileError) {
            console.error("Error creating profile:", profileError);
            // Si falla el profile, intentamos eliminar el usuario de auth para mantener consistencia
            await supabaseAdmin.auth.admin.deleteUser(userId);
            throw new Error(`Error al crear perfil: ${profileError.message}`);
        }

        // 3. Asignar al Laboratorio (SOLO si se proporciona Lab ID)
        if (labId && labId.trim() !== '') {
            // Pequeña pausa para asegurar que la base de datos procese el profile
            await new Promise(resolve => setTimeout(resolve, 100));

            const { error: memberError } = await supabaseAdmin
                .from('lab_members')
                .insert({
                    lab_id: labId,
                    user_id: userId,
                    role: role
                });

            if (memberError) {
                console.error("Error adding to lab_members:", memberError);
                // No eliminamos el usuario, pero informamos del error
                throw new Error(`Usuario creado pero error al asignar laboratorio: ${memberError.message}`);
            }
        } else if (role === 'super_admin') {
            console.log("Super Admin creado sin lab específico.");
        }

        return { success: true };

    } catch (error: any) {
        console.error('Error creating user:', error);
        return { error: error.message };
    }
}

export async function updateUserRole(userId: string, newRole: string, newLabId?: string) {
    try {
        // 1. SIEMPRE actualizar el rol en profiles (tabla principal de roles)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                role: newRole,
                updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);

        if (profileError) {
            console.error('Error updating profile role:', profileError);
            // Si no existe el profile, intentar con 'id' en lugar de 'user_id'
            const { error: profileError2 } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: newRole,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (profileError2) {
                throw new Error(`No se pudo actualizar el rol en profiles: ${profileError2.message}`);
            }
        }

        // 2. Manejar lab_members según corresponda
        if (newLabId && newLabId.trim() !== '') {
            // Primero verificar si ya existe un registro para este usuario
            const { data: existingMember } = await supabaseAdmin
                .from('lab_members')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (existingMember) {
                // Actualizar registro existente
                const { error: updateError } = await supabaseAdmin
                    .from('lab_members')
                    .update({
                        role: newRole,
                        lab_id: newLabId
                    })
                    .eq('user_id', userId);

                if (updateError) throw updateError;
            } else {
                // Crear nuevo registro
                const { error: insertError } = await supabaseAdmin
                    .from('lab_members')
                    .insert({
                        user_id: userId,
                        lab_id: newLabId,
                        role: newRole
                    });

                if (insertError) throw insertError;
            }
        } else {
            // Si no hay lab asignado, eliminar cualquier registro previo de lab_members
            // (usuario global sin lab específico)
            await supabaseAdmin
                .from('lab_members')
                .delete()
                .eq('user_id', userId);
        }

        // 3. Actualizar metadata del usuario en Auth
        await supabaseAdmin.auth.admin.updateUserById(userId, {
            user_metadata: { role: newRole }
        });

        return { success: true };
    } catch (error: any) {
        console.error('Error updating user role:', error);
        return { error: error.message };
    }
}

export async function deleteUser(userId: string) {
    try {
        // 1. Eliminar de lab_members
        await supabaseAdmin
            .from('lab_members')
            .delete()
            .eq('user_id', userId);

        // 2. Eliminar de profiles
        await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('user_id', userId);

        // 3. Eliminar de Auth (esto también eliminará los datos relacionados por las políticas de cascada)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) throw authError;

        return { success: true };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return { error: error.message };
    }
}
