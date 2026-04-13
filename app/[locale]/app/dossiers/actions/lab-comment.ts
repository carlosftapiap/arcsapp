'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { translateReviewComment } from './translate';

type SupportedLocale = 'es' | 'en' | 'hi' | 'zh-CN';

export interface ChatMessage {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    timestamp: string;
    content: Record<SupportedLocale, string>;
}

/**
 * Guarda el comentario (chat) en un dossier_item con traducciones automáticas
 */
export async function saveLabComment(
    dossierItemId: string,
    comment: string,
    userLocale: string,
    labId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = await createClient();

    try {
        // Validación básica
        if (!comment || comment.trim().length === 0) {
            return { success: false, error: 'Comentario vacío' };
        }

        // Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        // Obtener datos del perfil para el nombre y rol
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, role')
            .eq('user_id', user.id)
            .single();

        let senderName = profile?.full_name || 'Usuario';
        let senderRole = profile?.role || 'lab_viewer';

        // Intentar obtener rol específico de lab_members si no es rol global
        if (!['super_admin', 'reviewer', 'tecnico'].includes(senderRole) && labId) {
            const { data: member } = await supabase
                .from('lab_members')
                .select('role')
                .eq('user_id', user.id)
                .eq('lab_id', labId)
                .single();
            if (member?.role) senderRole = member.role;
        }

        // Obtener el item actual para ver qué hay en lab_comment_json
        const { data: currentItem, error: fetchError } = await supabase
            .from('dossier_items')
            .select('lab_comment_json, dossier_id')
            .eq('id', dossierItemId)
            .single();

        if (fetchError) throw fetchError;

        // Normalizar los comentarios existentes a Array
        let currentThread: ChatMessage[] = [];
        if (currentItem?.lab_comment_json) {
            const jsonVal = currentItem.lab_comment_json as any;
            if (Array.isArray(jsonVal)) {
                currentThread = jsonVal;
            } else if (typeof jsonVal === 'object') {
                // Es legacy (un solo comentario dict), lo convertimos a array (primer mensaje)
                currentThread = [{
                    id: 'legacy-msg',
                    sender_id: 'unknown',
                    sender_name: 'Laboratorio',
                    sender_role: 'lab_admin',
                    timestamp: new Date().toISOString(), // Fallback a hoy si no hay de otra
                    content: jsonVal
                }];
            }
        }

        // Normalizar el locale
        const supportedLocales: SupportedLocale[] = ['es', 'en', 'hi', 'zh-CN'];
        const originalLang: SupportedLocale = supportedLocales.includes(userLocale as SupportedLocale)
            ? (userLocale as SupportedLocale)
            : 'es';

        // Intentar traducir
        let translatedComments: Record<SupportedLocale, string> | null = null;
        try {
            translatedComments = await translateReviewComment(comment, originalLang, labId);
        } catch (translateError) {
            console.warn('Translation skipped:', translateError);
            // Si falla la traducción, guardar solo el idioma original
            translatedComments = { es: '', en: '', hi: '', 'zh-CN': '' };
            translatedComments[originalLang] = comment;
        }

        // Crear el nuevo mensaje
        const newMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sender_id: user.id,
            sender_name: senderName,
            sender_role: senderRole,
            timestamp: new Date().toISOString(),
            content: translatedComments! // We ensured it's not null via fallback
        };

        currentThread.push(newMessage);

        // Guardar el array completo de vuelta
        const { error: updateError } = await supabase
            .from('dossier_items')
            .update({ lab_comment_json: currentThread as any })
            .eq('id', dossierItemId);

        if (updateError) throw updateError;

        // Revalidar la página del dossier
        if (currentItem?.dossier_id) {
            revalidatePath(`/es/app/dossiers/${currentItem.dossier_id}`);
            revalidatePath(`/en/app/dossiers/${currentItem.dossier_id}`);
            revalidatePath(`/hi/app/dossiers/${currentItem.dossier_id}`);
            revalidatePath(`/zh-CN/app/dossiers/${currentItem.dossier_id}`);
        }

        return { success: true, data: currentThread };

    } catch (error: any) {
        console.error('Save lab comment error:', error);
        return { success: false, error: error.message };
    }
}
