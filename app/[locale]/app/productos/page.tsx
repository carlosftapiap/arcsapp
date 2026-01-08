import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ProductsClient from './ProductsClient';

export default async function ProductosPage() {
    const supabase = await createClient();

    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Obtener todos los laboratorios disponibles
    // Nota: Como es super admin, verá todos. Si queremos limitar a sus asignados, usaríamos get_user_lab_ids
    // pero el usuario pidió seleccionar entre "laboratorios creados".
    const { data: availableLabs } = await supabase
        .from('labs')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

    // Obtener laboratorio inicial (el primero)
    const initialLabId = availableLabs?.[0]?.id;

    if (!initialLabId) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">No hay laboratorios disponibles en el sistema.</p>
                <div className="mt-4">
                    <p className="text-xs text-gray-400">User ID: {user.id}</p>
                </div>
            </div>
        );
    }

    // Cargar productos del laboratorio inicial
    const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('lab_id', initialLabId)
        .order('created_at', { ascending: false });

    return (
        <ProductsClient
            initialProducts={products || []}
            availableLabs={availableLabs || []}
            initialLabId={initialLabId}
        />
    );
}
