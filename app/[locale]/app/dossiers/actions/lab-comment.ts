'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { translateReviewComment } from './translate';

type SupportedLocale = 'es' | 'en' | 'hi' | 'zh-CN';

/**
 * Guarda el comentario del laboratorio en un dossier_item con traducciones automáticas
 */
export async function saveLabComment(
    dossierItemId: string,
    comment: string,
    userLocale: string,
    labId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = await createClient();

    try {
        // Normalizar el locale
        const supportedLocales: SupportedLocale[] = ['es', 'en', 'hi', 'zh-CN'];
        const originalLang: SupportedLocale = supportedLocales.includes(userLocale as SupportedLocale)
            ? (userLocale as SupportedLocale)
            : 'es';

        // Si el comentario está vacío, limpiar el campo
        if (!comment || comment.trim().length === 0) {
            const { error } = await supabase
                .from('dossier_items')
                .update({ lab_comment_json: null })
                .eq('id', dossierItemId);

            if (error) throw error;

            return { success: true, data: null };
        }

        // Intentar traducir
        let translatedComments: Record<SupportedLocale, string> | null = null;
        try {
            translatedComments = await translateReviewComment(comment, originalLang, labId);
        } catch (translateError) {
            console.warn('Translation skipped:', translateError);
            // Si falla la traducción, guardar solo el idioma original
            translatedComments = {
                es: originalLang === 'es' ? comment : '',
                en: originalLang === 'en' ? comment : '',
                hi: originalLang === 'hi' ? comment : '',
                'zh-CN': originalLang === 'zh-CN' ? comment : ''
            };
            translatedComments[originalLang] = comment;
        }

        // Guardar el comentario traducido
        const { data, error } = await supabase
            .from('dossier_items')
            .update({ lab_comment_json: translatedComments })
            .eq('id', dossierItemId)
            .select('dossier_id')
            .single();

        if (error) throw error;

        // Revalidar la página del dossier
        if (data?.dossier_id) {
            revalidatePath(`/es/app/dossiers/${data.dossier_id}`);
            revalidatePath(`/en/app/dossiers/${data.dossier_id}`);
            revalidatePath(`/hi/app/dossiers/${data.dossier_id}`);
            revalidatePath(`/zh-CN/app/dossiers/${data.dossier_id}`);
        }

        return { success: true, data: translatedComments };

    } catch (error: any) {
        console.error('Save lab comment error:', error);
        return { success: false, error: error.message };
    }
}
