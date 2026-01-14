'use server';

import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { revalidatePath } from 'next/cache';

// Idiomas soportados por la aplicación
type SupportedLocale = 'es' | 'en' | 'hi' | 'zh-CN';

const langNames: Record<SupportedLocale, string> = {
    es: 'español',
    en: 'inglés',
    hi: 'hindi',
    'zh-CN': 'chino simplificado'
};

/**
 * Traduce un texto de un idioma a otro usando OpenAI
 */
export async function translateText(
    text: string,
    fromLang: SupportedLocale,
    toLang: SupportedLocale,
    labId?: string
): Promise<{ success: boolean; translation?: string; error?: string }> {
    if (!text || text.trim().length === 0) {
        return { success: true, translation: text };
    }

    // Si los idiomas son iguales, devolver el mismo texto
    if (fromLang === toLang) {
        return { success: true, translation: text };
    }

    const supabase = await createClient();

    try {
        // Obtener API Key del lab o usar una global
        let apiKey: string | null = null;

        if (labId) {
            const { data: lab } = await supabase
                .from('labs')
                .select('openai_api_key')
                .eq('id', labId)
                .single();

            apiKey = lab?.openai_api_key || null;
        }

        // Si no hay API key, usar fallback o retornar el texto original
        if (!apiKey) {
            console.warn('No OpenAI API key available for translation. Returning original text.');
            return { success: true, translation: text };
        }

        const openai = new OpenAI({ apiKey });

        const response = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: `Eres un traductor profesional. Traduce el siguiente texto de ${langNames[fromLang]} a ${langNames[toLang]}. 
                    Mantén el tono profesional y técnico del contexto regulatorio farmacéutico.
                    Devuelve SOLO el texto traducido, sin explicaciones adicionales.`
                },
                {
                    role: 'user',
                    content: text
                }
            ],
            model: 'gpt-3.5-turbo',
            temperature: 0.3,
            max_tokens: 500
        });

        const translation = response.choices[0].message.content?.trim() || text;

        return { success: true, translation };

    } catch (error: any) {
        console.error('Translation error:', error);
        return { success: false, error: error.message, translation: text };
    }
}

/**
 * Traduce un comentario/dictamen técnico a todos los idiomas soportados
 */
export async function translateReviewComment(
    comment: string,
    originalLang: SupportedLocale,
    labId?: string
): Promise<Record<SupportedLocale, string>> {
    const translations: Record<SupportedLocale, string> = {
        es: comment,
        en: comment,
        hi: comment,
        'zh-CN': comment
    };

    // Establecer el idioma original
    translations[originalLang] = comment;

    // Traducir a todos los demás idiomas
    const targetLangs: SupportedLocale[] = ['es', 'en', 'hi', 'zh-CN'].filter(
        lang => lang !== originalLang
    ) as SupportedLocale[];

    // Traducir en paralelo
    const promises = targetLangs.map(async (targetLang) => {
        const result = await translateText(comment, originalLang, targetLang, labId);
        return { lang: targetLang, text: result.translation || comment };
    });

    const results = await Promise.all(promises);

    for (const result of results) {
        translations[result.lang] = result.text;
    }

    return translations;
}

/**
 * Guarda un dictamen técnico con traducciones automáticas
 * Retrocompatible: si la columna comments_i18n no existe, guarda sin ella
 */
export async function saveReviewWithTranslation(
    documentId: string,
    reviewerId: string,
    decision: 'approved' | 'observed',
    comment: string,
    versionReviewed: number,
    userLocale: string,
    labId?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
    const supabase = await createClient();

    try {
        // 1. Obtener el dossier_item_id del documento
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('dossier_item_id')
            .eq('id', documentId)
            .single();
        
        if (docError) {
            console.warn('Could not get dossier_item_id:', docError.message);
        }

        // Normalizar el locale
        const supportedLocales: SupportedLocale[] = ['es', 'en', 'hi', 'zh-CN'];
        const originalLang: SupportedLocale = supportedLocales.includes(userLocale as SupportedLocale)
            ? (userLocale as SupportedLocale)
            : 'es';

        // Intentar traducir, pero no fallar si no hay API key
        let translatedComments: Record<SupportedLocale, string> | null = null;
        try {
            translatedComments = await translateReviewComment(comment, originalLang, labId);
        } catch (translateError) {
            console.warn('Translation skipped:', translateError);
            // Continuar sin traducciones
        }

        // Intentar guardar con traducciones (si la columna existe)
        let newReview;

        // Si hay traducciones, intentar guardar con ellas
        if (translatedComments) {
            const result1 = await supabase
                .from('technical_reviews')
                .insert({
                    document_id: documentId,
                    reviewer_id: reviewerId,
                    decision: decision,
                    comments: comment,
                    comments_i18n: translatedComments,
                    version_reviewed: versionReviewed
                })
                .select()
                .single();

            if (!result1.error) {
                newReview = result1.data;
            } else {
                console.warn('Insert with i18n failed, trying without:', result1.error.message);
            }
        }

        // Si no hay traducciones o falló el primer intento, guardar sin comments_i18n
        if (!newReview) {
            const result2 = await supabase
                .from('technical_reviews')
                .insert({
                    document_id: documentId,
                    reviewer_id: reviewerId,
                    decision: decision,
                    comments: comment,
                    version_reviewed: versionReviewed
                })
                .select()
                .single();

            if (result2.error) {
                throw result2.error;
            }

            newReview = result2.data;
        }

        // 2. Actualizar el estado del dossier_item
        if (doc?.dossier_item_id) {
            const newStatus = decision === 'approved' ? 'approved' : 'observed';
            const { error: updateError } = await supabase
                .from('dossier_items')
                .update({ status: newStatus })
                .eq('id', doc.dossier_item_id);
            
            if (updateError) {
                console.warn('Could not update dossier_item status:', updateError.message);
            } else {
                console.log(`✅ dossier_item ${doc.dossier_item_id} status updated to ${newStatus}`);
            }

            // 3. Obtener dossier_id para revalidar la página
            const { data: itemData } = await supabase
                .from('dossier_items')
                .select('dossier_id')
                .eq('id', doc.dossier_item_id)
                .single();
            
            if (itemData?.dossier_id) {
                // Forzar recarga de datos en todas las rutas del dossier
                revalidatePath(`/es/app/dossiers/${itemData.dossier_id}`);
                revalidatePath(`/en/app/dossiers/${itemData.dossier_id}`);
                console.log(`🔄 Revalidated path for dossier ${itemData.dossier_id}`);
            }
        }

        return { success: true, data: newReview };

    } catch (error: any) {
        console.error('Save review error:', error);
        return { success: false, error: error.message };
    }
}
