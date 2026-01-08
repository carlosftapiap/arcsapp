import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import ConfigWrapper from './ConfigWrapper'; // Usaremos un wrapper cliente para el estado del lab

export default async function ConfiguracionPage() {
    const t = await getTranslations();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener labs activos del usuario
    // RLS ya filtra, pero forzamos status active
    const { data: labs } = await supabase
        .from('labs')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

    if (!labs || labs.length === 0) {
        return <div className="p-8 text-center text-gray-500">No tienes laboratorios asignados.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('nav.settings')}</h1>
                <p className="text-gray-600 mt-1">Configuración general e integraciones.</p>
            </div>

            <ConfigWrapper labs={labs} />
        </div>
    );
}
