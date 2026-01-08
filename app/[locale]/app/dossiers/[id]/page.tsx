import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import DossierDetailClient from './DossierDetailClient';

// Definir interfaces mínimas para el tipado interno si es necesario,
// aunque Supabase devuelve tipos bastante útiles.

export default async function DossierDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const supabase = await createClient();

    // 1. Fetch Dossier
    const { data: dossier, error: dossierError } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', id)
        .single();

    if (dossierError || !dossier) {
        return (
            <div className="p-8 text-center text-red-600">
                <h1 className="text-xl font-bold">Error</h1>
                <p>No se pudo cargar el dossier ({id}).</p>
                <pre className="text-xs mt-2 bg-gray-100 p-2 text-left mx-auto max-w-lg overflow-auto">
                    {JSON.stringify(dossierError, null, 2)}
                </pre>
            </div>
        );
    }

    // 2. Fetch Dossier Items (Raw Data)
    const { data: rawItems, error: itemsError } = await supabase
        .from('dossier_items')
        .select(`
      id,
      status,
      checklist_items:checklist_item_id (
        id, code, module, title_i18n_json, required, critical, sort_order, allows_multiple_files
      ),
      documents (
        id, file_path, uploaded_at, version, status,
        ai_document_analyses (
          id, created_at, status, alerts, analysis_json
        ),
        technical_reviews (
          id, created_at, decision, comments, comments_i18n, reviewer_id, version_reviewed
        )
      )
    `)
        .eq('dossier_id', id)
        // Ordenamos por la tabla relacionada para tener un orden base,
        // pero confiaremos más en el sort JS posterior si es complejo.
        .order('sort_order', { foreignTable: 'checklist_items', ascending: true });

    if (itemsError) {
        console.error('Error fetching items:', itemsError);
        return <div className="p-8 text-red-600">Error cargando items: {itemsError.message}</div>;
    }

    // 2.1 Ordenamiento manual en JS para garantizar consistencia (Fix deep sorting issues)
    if (rawItems) {
        rawItems.forEach(item => {
            if (item.documents) {
                // Ordenar documentos por versión descendente (opcional, pero buena práctica)
                item.documents.sort((a: any, b: any) => (b.version || 0) - (a.version || 0));

                // Ordenar revisiones técnicas y análisis IA: Más reciente primero
                item.documents.forEach((doc: any) => {
                    if (doc.technical_reviews && Array.isArray(doc.technical_reviews)) {
                        doc.technical_reviews.sort((a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                    }
                    // Ordenar análisis IA: Más reciente primero
                    if (doc.ai_document_analyses && Array.isArray(doc.ai_document_analyses)) {
                        doc.ai_document_analyses.sort((a: any, b: any) =>
                            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                        );
                    }
                });
            }
        });
    }

    // 3. Verificación de Dossier Vacío (Reparación)
    // IMPORTANTE: Validamos contra 'rawItems'
    if (!rawItems || rawItems.length === 0) {
        return (
            <div className="p-12 text-center">
                <h2 className="text-xl font-bold mb-4">Dossier Vacío</h2>
                <p className="mb-6 text-gray-600">Este dossier no tiene requisitos asociados. Es posible que se haya creado sin una plantilla activa.</p>

                <div className="max-w-md mx-auto bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <h3 className="font-semibold text-blue-900 mb-2">Reparación Automática</h3>
                    <p className="text-sm text-blue-700 mb-4">
                        El sistema intentará buscar una plantilla para tipo <strong>{dossier.product_type}</strong> e inyectar los requisitos.
                    </p>

                    <form action={async () => {
                        'use server';
                        const sb = await createClient(); // Usa cliente autenticado (asegúrate de ser admin/uploader)

                        const productType = dossier.product_type || 'medicine_general';

                        // A) Buscar plantilla para ESTE tipo de producto
                        let { data: tmpl } = await sb
                            .from('checklist_templates')
                            .select('id')
                            .eq('active', true)
                            .eq('product_type', productType)
                            .limit(1)
                            .single();

                        // Si no existe plantilla, CREARLA con items oficiales
                        if (!tmpl) {
                            console.log(`Creando plantilla base para ${productType}...`);
                            const { data: newTmp, error: newTmpErr } = await sb
                                .from('checklist_templates')
                                .insert({ name: `Plantilla Base ${productType}`, version: 1, product_type: productType, active: true })
                                .select().single();

                            if (newTmpErr) throw new Error("Error creando plantilla: " + newTmpErr.message);
                            tmpl = newTmp;

                            // Insertar Items Oficiales
                            const officialItems = [
                                { module: 'Legal', code: 'A-01', title: 'Certificado BPM/GMP', required: true, critical: true, sort_order: 1 },
                                { module: 'Legal', code: 'A-02', title: 'CPP (OMS) o CLV', required: true, critical: true, sort_order: 2 },
                                { module: 'Legal', code: 'A-04', title: 'Poder Legal', required: true, critical: true, sort_order: 4 },
                                { module: 'Quality', code: 'B-01', title: 'Certificado de Análisis (CoA)', required: true, critical: true, sort_order: 10 },
                                { module: 'Quality', code: 'B-04', title: 'Fórmula Cuali-Cuantitativa', required: true, critical: true, sort_order: 13 },
                                { module: 'Quality', code: 'B-09', title: 'Metodología Analítica', required: true, critical: true, sort_order: 18 },
                                { module: 'Stability_Clinical', code: 'C-01', title: 'Estudios de Estabilidad', required: true, critical: true, sort_order: 30 },
                                { module: 'Stability_Clinical', code: 'C-02', title: 'Conclusión de Vida Útil', required: true, critical: true, sort_order: 31 },
                            ].map(i => ({ template_id: tmpl!.id, module: i.module, code: i.code, title_i18n_json: { es: i.title }, required: i.required, critical: i.critical, sort_order: i.sort_order }));

                            await sb.from('checklist_items').insert(officialItems);
                        }

                        const templateId = tmpl!.id;

                        // B) Obtener items de la plantilla
                        const { data: chkItems, error: chkErr } = await sb
                            .from('checklist_items')
                            .select('id')
                            .eq('template_id', templateId);

                        if (chkErr || !chkItems?.length) {
                            console.error("Error Repair: Plantilla sin items", chkErr);
                            throw new Error('La plantilla existe pero no tiene items.');
                        }

                        // C) Insertar en dossier_items
                        const { error: insErr } = await sb.from('dossier_items').insert(
                            chkItems.map(i => ({ dossier_id: id, checklist_item_id: i.id, status: 'pending' }))
                        );

                        if (insErr) {
                            console.error("Error Repair: Insert failed", insErr);
                            throw insErr;
                        }
                        console.log("✅ Dossier reparado exitosamente con items de plantilla ID:", templateId);
                    }}>
                        <button type="submit" className="w-full btn-primary bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow-sm transition-colors">
                            Reparar e Inyectar Items
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // 4. Transformación y Ordenamiento (Data Refining)
    const items = rawItems.map((row: any) => {
        // Manejo robusto de join único
        const checklistItem = Array.isArray(row.checklist_items) ? row.checklist_items[0] : row.checklist_items;

        // Ordenar documentos en Javascript (Versión Descendente > Fecha Descendente)
        const documentsSorted = (row.documents || []).slice().sort((a: any, b: any) => {
            const vA = a.version || 0;
            const vB = b.version || 0;
            if (vA !== vB) return vB - vA; // Mayor versión primero
            return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime(); // Más reciente primero
        });

        return {
            id: row.id,
            status: row.status,
            checklist_item: checklistItem,
            documents: documentsSorted
        };
    });

    // Reordenar items usando sort_order del checklist (Javascript sort es más fiable tras el fetch)
    items.sort((a, b) => {
        const orderA = a.checklist_item?.sort_order || 999;
        const orderB = b.checklist_item?.sort_order || 999;
        return orderA - orderB;
    });

    // 5. Determinar Rol del Usuario
    const { data: { user } } = await supabase.auth.getUser();
    let userRole = 'lab_viewer';

    if (user) {
        // 1. Primero verificar rol global en profiles (para reviewer y super_admin globales)
        const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (profileData?.role && ['reviewer', 'super_admin'].includes(profileData.role)) {
            userRole = profileData.role;
        } else {
            // 2. Si no es revisor global, buscar rol en el laboratorio específico
            const { data: memberData } = await supabase
                .from('lab_members')
                .select('role')
                .eq('lab_id', dossier.lab_id)
                .eq('user_id', user.id)
                .single();

            if (memberData?.role) userRole = memberData.role;
        }

        // Override manual para admin principal
        if (user.email === 'admin@arcsapp.com') userRole = 'super_admin';
    }

    console.log('🔑 User role determined:', { userId: user?.id, userRole });

    return <DossierDetailClient dossier={dossier} initialItems={items} userRole={userRole} />;
}
