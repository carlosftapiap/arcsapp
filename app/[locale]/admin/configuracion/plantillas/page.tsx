import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import TemplatesClient from './TemplatesClient';

export default async function PlantillasPage() {
    const supabase = await createClient();
    const t = await getTranslations();

    // Fetch plantillas ordenadas
    const { data: templates } = await supabase
        .from('checklist_templates')
        .select('*')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-6 h-full">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('config.templates.title')}</h1>
                <p className="text-gray-600 mt-1">{t('config.templates.description')}</p>
            </div>

            <TemplatesClient initialTemplates={templates || []} />
        </div>
    );
}
