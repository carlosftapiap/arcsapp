import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ 
                success: false, 
                error: 'No autenticado' 
            }, { status: 401 });
        }

        // Verificar si es super_admin
        const isSuperAdmin = user.email === 'admin@arcsapp.com';
        
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
        
        const isSuperAdminByRole = profile?.role === 'super_admin';

        // Obtener auditorías
        let query = supabase
            .from('audits')
            .select('id, product_name, manufacturer, file_name, total_pages, stages_found, problems_found, status, created_at, processing_time_ms')
            .order('created_at', { ascending: false })
            .limit(50);

        // Super admin ve todas las auditorías
        if (!isSuperAdmin && !isSuperAdminByRole) {
            // Usuarios normales: filtrar por lab_id o user_id
            const { data: membership } = await supabase
                .from('lab_members')
                .select('lab_id')
                .eq('user_id', user.id)
                .limit(1)
                .single();

            const labId = membership?.lab_id;
            
            if (labId) {
                query = query.eq('lab_id', labId);
            } else {
                query = query.eq('user_id', user.id);
            }
        }

        const { data: audits, error } = await query;

        if (error) {
            console.error('Error fetching audits:', error);
            return NextResponse.json({ 
                success: false, 
                error: 'Error al obtener auditorías' 
            }, { status: 500 });
        }

        return NextResponse.json({ 
            success: true, 
            data: audits || [] 
        });

    } catch (error: any) {
        console.error('Error in audit history:', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
