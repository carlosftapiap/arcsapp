
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Usamos SERVICE_ROLE_KEY si es posible para saltar RLS y ver la verdad absoluta
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseKey && !supabaseServiceKey)) {
    console.error('Faltan variables de entorno (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY o SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

const TARGET_DOSSIER_ID = 'b560d37b-6eb3-4d7c-a4bf-97052356da30';

async function diagnose() {
    console.log('--- DIAGNÓSTICO DE DOSSIER ---');
    console.log('Dossier ID:', TARGET_DOSSIER_ID);

    // 1. Verificar si el Dossier existe
    const { data: dossier, error: dbError } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', TARGET_DOSSIER_ID)
        .single();

    if (dbError) {
        console.error('❌ Error buscando Dossier:', dbError.message);
        return;
    }
    if (!dossier) {
        console.error('❌ El Dossier NO existe en la base de datos.');
        return;
    }
    console.log('✅ Dossier encontrado:', dossier.product_name, `(Tipo: ${dossier.product_type})`);

    // 2. Buscar Items crudos (sin joins complejos)
    const { data: rawItems, error: itemsError } = await supabase
        .from('dossier_items')
        .select('id, checklist_item_id, status')
        .eq('dossier_id', TARGET_DOSSIER_ID);

    if (itemsError) {
        console.error('❌ Error buscando Items:', itemsError.message);
    } else {
        console.log(`ℹ️ Items encontrados (crudos): ${rawItems.length}`);
    }

    // 3. Verificar estado de Plantillas (¿Hay de dónde copiar?)
    const { data: templates, error: tmplError } = await supabase
        .from('checklist_templates')
        .select('id, version, product_type, active')
        .eq('active', true);

    console.log('--- ESTADO DE PLANTILLAS ---');
    if (tmplError) console.error('Error:', tmplError.message);
    else {
        console.log(`Plantillas activas encontradas: ${templates.length}`);
        templates.forEach(t => console.log(` - [${t.product_type}] v${t.version} (${t.id})`));
    }

    if (rawItems.length === 0) {
        console.log('\n⚠️ CONCLUSIÓN: El dossier está VACÍO. La creación falló al copiar items o no había plantilla.');
    } else {
        console.log('\n⚠️ CONCLUSIÓN: El dossier TIENE datos, pero la UI no los ve. Posible error de RLS o Join.');
    }
}

diagnose();
