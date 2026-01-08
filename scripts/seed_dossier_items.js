const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// --- CARGA .env.local ---
let env = {};
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
    });
} catch (e) { }

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Se requiere SUPABASE_SERVICE_ROLE_KEY en .env.local para reparar datos.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_DOSSIER_ID = 'b560d37b-6eb3-4d7c-a4bf-97052356da30';

async function seed() {
    console.log(`🔧 Reparando Dossier: ${TARGET_DOSSIER_ID}`);

    // 0) Leer dossier (para saber product_type)
    const { data: dossier, error: dossierErr } = await supabase
        .from('dossiers')
        .select('id, product_type')
        .eq('id', TARGET_DOSSIER_ID)
        .single();

    if (dossierErr || !dossier) {
        console.error("❌ No se pudo leer el dossier:", dossierErr?.message);
        process.exit(1);
    }

    const productType = dossier.product_type || 'medicine_general'; // fallback
    console.log(`📌 product_type del dossier: ${productType}`);

    // 1) Verificar si ya tiene items
    const { count, error: countErr } = await supabase
        .from('dossier_items')
        .select('*', { count: 'exact', head: true })
        .eq('dossier_id', TARGET_DOSSIER_ID);

    if (countErr) {
        console.error("❌ Error contando dossier_items:", countErr.message);
        process.exit(1);
    }

    if ((count || 0) > 0) {
        console.log(`✅ El dossier ya tiene ${count} items. No se requiere acción.`);
        return;
    }

    console.log("⚠️ El dossier está vacío. Buscando plantilla activa...");

    // 2) Buscar plantilla activa por product_type
    let { data: template, error: tmplErr } = await supabase
        .from('checklist_templates')
        .select('id')
        .eq('active', true)
        .eq('product_type', productType)
        .limit(1)
        .single();

    // Si no existe plantilla activa compatible, crearla
    if (tmplErr || !template) {
        console.log("⚠️ No hay plantilla activa para este tipo. Creando plantilla base...");
        const { data: newTmp, error: newTmpErr } = await supabase
            .from('checklist_templates')
            .insert({
                name: `Plantilla Base ${productType}`,
                version: 1,
                product_type: productType,
                active: true
            })
            .select()
            .single();

        if (newTmpErr || !newTmp) {
            console.error("❌ No se pudo crear plantilla:", newTmpErr?.message);
            process.exit(1);
        }
        template = newTmp;
    }

    const templateId = template.id;

    // 3) Buscar items de plantilla
    let { data: items, error: itemsErr } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('template_id', templateId);

    if (itemsErr) {
        console.error("❌ Error leyendo checklist_items:", itemsErr.message);
        process.exit(1);
    }

    // 4) Si no hay items, crear ITEMS OFICIALES (medicamento general)
    if (!items || items.length === 0) {
        console.log("⚠️ La plantilla no tiene items. Creando checklist oficial (medicine_general)...");

        // Si el dossier NO es medicine_general, aquí deberías cargar otro set.
        // Por ahora, este bloque está pensado para medicine_general.
        const officialItems = [
            // A: Legal
            { module: 'Legal', code: 'A-01', title: 'Certificado BPM/GMP', required: true, critical: true, sort_order: 1 },
            { module: 'Legal', code: 'A-02', title: 'CPP (OMS) o CLV o Certificado de Exportación', required: true, critical: true, sort_order: 2 },
            { module: 'Legal', code: 'A-03', title: 'Declaración del Titular – Estado Regulatorio Internacional', required: true, critical: false, sort_order: 3 },
            { module: 'Legal', code: 'A-04', title: 'Autorización del Titular (Poder Legal)', required: true, critical: true, sort_order: 4 },

            // B: Quality
            { module: 'Quality', code: 'B-01', title: 'Certificado de Análisis de Producto Terminado (CoA)', required: true, critical: true, sort_order: 10 },
            { module: 'Quality', code: 'B-02', title: 'Certificados de Análisis de Materia Prima / API', required: true, critical: true, sort_order: 11 },
            { module: 'Quality', code: 'B-03', title: 'Especificaciones de Calidad de Producto Terminado', required: true, critical: true, sort_order: 12 },
            { module: 'Quality', code: 'B-04', title: 'Fórmula Cuali–Cuantitativa Completa (Unidades SI)', required: true, critical: true, sort_order: 13 },
            { module: 'Quality', code: 'B-05', title: 'Justificación de Fórmula (Función Tecnológica)', required: true, critical: false, sort_order: 14 },
            { module: 'Quality', code: 'B-06', title: 'Declaración de Excipientes/Colorantes (si aplica)', required: false, critical: false, sort_order: 15 },
            { module: 'Quality', code: 'B-07', title: 'Descripción del Proceso de Fabricación', required: true, critical: true, sort_order: 16 },
            { module: 'Quality', code: 'B-08', title: 'Diagrama de Flujo del Proceso', required: true, critical: false, sort_order: 17 },
            { module: 'Quality', code: 'B-09', title: 'Metodología Analítica y Validación', required: true, critical: true, sort_order: 18 },
            { module: 'Quality', code: 'B-10', title: 'Interpretación del Código de Lote', required: true, critical: false, sort_order: 19 },
            { module: 'Quality', code: 'B-11', title: 'Descripción de Envase Primario y Secundario', required: true, critical: false, sort_order: 20 },

            // C: Stability/Clinical
            { module: 'Stability_Clinical', code: 'C-01', title: 'Estudios de Estabilidad (Largo Plazo y Acelerado)', required: true, critical: true, sort_order: 30 },
            { module: 'Stability_Clinical', code: 'C-02', title: 'Protocolo de Estabilidad y Conclusión de Vida Útil', required: true, critical: true, sort_order: 31 },
            { module: 'Stability_Clinical', code: 'C-03', title: 'Cromatogramas/Registros Analíticos (si aplica)', required: false, critical: false, sort_order: 32 },
            { module: 'Stability_Clinical', code: 'C-04', title: 'Soporte Clínico/Farmacológico (si aplica)', required: false, critical: false, sort_order: 33 },
            { module: 'Stability_Clinical', code: 'C-05', title: 'Etiquetas del país de origen (solo importados)', required: false, critical: false, sort_order: 34 },
        ].map(i => ({
            template_id: templateId,
            module: i.module,
            code: i.code,
            title_i18n_json: { es: i.title },
            required: i.required,
            critical: i.critical,
            sort_order: i.sort_order
        }));

        const { data: insertedItems, error: insItemsErr } = await supabase
            .from('checklist_items')
            .insert(officialItems)
            .select('id');

        if (insItemsErr) {
            console.error("❌ Error creando checklist_items:", insItemsErr.message);
            process.exit(1);
        }

        items = insertedItems;
    }

    // 5) Insertar dossier_items
    console.log(`📥 Insertando ${items.length} items en el Dossier...`);

    const dossierItems = items.map(i => ({
        dossier_id: TARGET_DOSSIER_ID,
        checklist_item_id: i.id,
        status: 'pending'
    }));

    const { error: insertError } = await supabase.from('dossier_items').insert(dossierItems);

    if (insertError) {
        console.error("❌ Error al insertar dossier_items:", insertError.message);
        process.exit(1);
    }

    console.log("✅ ¡Dossier reparado con éxito! Recarga la página.");
}

seed().catch(e => {
    console.error("❌ Error fatal:", e);
    process.exit(1);
});
