import { getTranslations } from 'next-intl/server';
import { Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import LabsClient from './LabsClient';

export default async function LaboratoriosPage() {
    const t = await getTranslations();
    const supabase = await createClient();

    // Cargar labs desde la base de datos
    const { data: labs } = await supabase
        .from('labs')
        .select('*')
        .order('created_at', { ascending: false });

    return <LabsClient initialLabs={labs || []} />;
}
