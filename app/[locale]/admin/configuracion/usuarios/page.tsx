import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import UsersClient from './UsersClient';

export default async function UsuariosPage() {
    const supabase = await createClient();

    // Cargar usuarios y laboratorios
    const { data: profiles } = await supabase
        .from('profiles')
        .select(`
      *,
      lab_members(
        lab_id,
        role,
        labs(name)
      )
    `)
        .order('created_at', { ascending: false });

    const { data: labs } = await supabase
        .from('labs')
        .select('id, name')
        .eq('status', 'active')
        .order('name');

    return <UsersClient initialProfiles={profiles || []} labs={labs || []} />;
}
