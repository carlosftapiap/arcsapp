import { createClient } from '@/lib/supabase/server';
import { getTranslations } from 'next-intl/server';
import LabUsersClient from './LabUsersClient';

export default async function LabUsersPage() {
    const supabase = await createClient();
    const t = await getTranslations();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Obtener TODOS los laboratorios disponibles para el usuario
    const { data: availableLabs } = await supabase
        .from('labs')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

    if (!availableLabs || availableLabs.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No tienes acceso a ningún laboratorio activo.</p>
            </div>
        );
    }

    // Por defecto seleccionamos el primero
    const initialLabId = availableLabs[0].id;

    return (
        <LabUsersClient
            availableLabs={availableLabs}
            initialLabId={initialLabId}
        />
    );
}
