import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PromptsIAClient from './PromptsIAClient';

export default async function PromptsIAPage({
    params
}: {
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const supabase = await createClient();
    const t = await getTranslations();

    // Verificar que sea super_admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/login`);

    const { data: membership } = await supabase
        .from('lab_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .single();

    if (!membership) {
        redirect(`/${locale}/app`);
    }

    // Fetch plantillas con sus items
    const { data: templates } = await supabase
        .from('checklist_templates')
        .select(`
            id,
            product_type,
            name,
            version,
            active,
            checklist_items (
                id,
                code,
                module,
                title_i18n_json,
                ai_prompt,
                ai_cross_references,
                sort_order
            )
        `)
        .eq('active', true)
        .order('name', { ascending: true });

    return (
        <div className="space-y-6 h-full">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Configuración de Prompts IA</h1>
                <p className="text-gray-600 mt-1">
                    Define los prompts de validación de IA para cada requisito del checklist.
                </p>
            </div>

            <PromptsIAClient initialTemplates={templates || []} />
        </div>
    );
}
