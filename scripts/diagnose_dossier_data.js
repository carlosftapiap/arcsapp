const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

let env = {};
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^"(.*)"$/, '$1');
    });
} catch (e) {
    console.warn("No se pudo leer .env.local:", e.message);
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('❌ Error: Falta NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
}

// 🔒 Diagnóstico confiable => SOLO service role
if (!supabaseServiceKey) {
    console.error('❌ Error: Falta SUPABASE_SERVICE_ROLE_KEY (diagnóstico requiere evitar RLS).');
    process.exit(1);
}

console.log(`Conectando a: ${supabaseUrl.substring(0, 25)}...`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_DOSSIER_ID = 'b560d37b-6eb3-4d7c-a4bf-97052356da30';

async function diagnose() {
    let logOutput = "";
    const log = (msg) => { console.log(msg); logOutput += msg + "\n"; };

    log('--- DIAGNÓSTICO DE DOSSIER ---');

    // 1) Dossier
    const { data: dossier, error: dbError } = await supabase
        .from('dossiers')
        .select('id, product_name, product_type, lab_id')
        .eq('id', TARGET_DOSSIER_ID)
        .single();

    if (dbError) {
        log('❌ Error Dossier: ' + dbError.message);
        fs.writeFileSync('diagnose_output.txt', logOutput);
        return;
    }
    if (!dossier) {
        log('❌ Dossier NO encontrado.');
        fs.writeFileSync('diagnose_output.txt', logOutput);
        return;
    }

    log(`✅ Dossier: ${dossier.product_name} (${dossier.product_type})`);
    log(`   lab_id: ${dossier.lab_id}`);

    // 2) Dossier items
    const { data: rawItems, error: itemsError } = await supabase
        .from('dossier_items')
        .select('id, checklist_item_id, status')
        .eq('dossier_id', TARGET_DOSSIER_ID);

    if (itemsError) log('❌ Error Items: ' + itemsError.message);
    else log(`ℹ️ Items encontrados: ${(rawItems || []).length}`);

    // 3) Plantillas activas (global)
    const { data: templates, error: tmplError } = await supabase
        .from('checklist_templates')
        .select('id, version, product_type, active')
        .eq('active', true);

    log('--- PLANTILLAS ACTIVAS ---');
    if (tmplError) log('❌ Error plantillas: ' + tmplError.message);
    if (templates && templates.length > 0) {
        templates.forEach(t => log(` - ${t.product_type} v${t.version} (id=${t.id})`));
    } else {
        log('❌ NO HAY PLANTILLAS ACTIVAS');
    }

    // 4) Plantilla activa compatible con el product_type del dossier
    const { data: compatibleTemplate, error: compErr } = await supabase
        .from('checklist_templates')
        .select('id, version, product_type')
        .eq('active', true)
        .eq('product_type', dossier.product_type)
        .limit(1)
        .single();

    if (compErr || !compatibleTemplate) {
        log(`❌ NO hay plantilla activa para product_type = ${dossier.product_type}`);
    } else {
        log(`✅ Plantilla compatible: ${compatibleTemplate.product_type} v${compatibleTemplate.version} (id=${compatibleTemplate.id})`);

        // 5) Conteo de items en esa plantilla
        const { count: itemCount, error: itemCountErr } = await supabase
            .from('checklist_items')
            .select('*', { count: 'exact', head: true })
            .eq('template_id', compatibleTemplate.id);

        if (itemCountErr) log('❌ Error contando checklist_items: ' + itemCountErr.message);
        else log(`ℹ️ checklist_items en plantilla: ${itemCount || 0}`);
    }

    // 6) Conclusión (mejorada)
    const n = (rawItems || []).length;
    log('\n--- CONCLUSIÓN ---');

    if (n === 0) {
        log('⚠️ El dossier NO tiene dossier_items.');
        if (!compatibleTemplate) {
            log('➡️ Causa probable: no existía plantilla activa para el product_type al momento de crear el dossier.');
        } else {
            log('➡️ Hay plantilla compatible. Causa probable: bug en el flujo de creación (no se copiaron checklist_items a dossier_items).');
        }
    } else {
        log('✅ Hay dossier_items en DB.');
        log('➡️ Si la app no los muestra, revisa: query (joins), RLS/policies, o mapping de relaciones.');
    }

    fs.writeFileSync('diagnose_output.txt', logOutput);
    log('\n📝 Guardado en: diagnose_output.txt');
}

diagnose().catch(e => {
    console.error('❌ Error fatal:', e);
    process.exit(1);
});
