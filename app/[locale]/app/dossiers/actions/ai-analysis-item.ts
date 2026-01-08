'use server';

import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { buildCompletePrompt, isMultiFileStage } from '@/lib/ai/prompts-arcsa';
// @ts-ignore
const pdf = require('pdf-parse');
// @ts-ignore
const mammoth = require('mammoth');

/**
 * Extrae texto de un archivo (PDF, DOCX, DOC)
 */
async function extractTextFromFile(buffer: Buffer, filePathLower: string): Promise<{ text: string; needsOcr: boolean }> {
    let textContent = '';
    let needsOcr = false;

    if (filePathLower.endsWith('.pdf')) {
        let pdfParser = pdf;
        // @ts-ignore
        if (typeof pdfParser !== 'function' && pdfParser.default) {
            pdfParser = pdfParser.default;
        }
        const pdfData = await pdfParser(buffer);
        textContent = (pdfData.text || '').slice(0, 8000); // 8k por archivo para multi
        
        // Si hay muy poco texto, probablemente es escaneado
        if (textContent.trim().length < 100) {
            needsOcr = true;
        }
    } else if (filePathLower.endsWith('.docx')) {
        const result = await mammoth.extractRawText({ buffer });
        textContent = (result.value || '').slice(0, 8000);
    } else if (filePathLower.endsWith('.doc')) {
        try {
            const result = await mammoth.extractRawText({ buffer });
            textContent = (result.value || '').slice(0, 8000);
        } catch {
            throw new Error('Formato .doc no soportado');
        }
    } else {
        throw new Error(`Formato no soportado: ${filePathLower}`);
    }

    return { text: textContent, needsOcr };
}

/**
 * Análisis consolidado de TODOS los documentos de una etapa (dossier_item)
 * Ideal para etapas multi-archivo como A-02, B-02, C-01, C-05, etc.
 */
export async function runAIAnalysisForItem(dossierItemId: string) {
    const supabase = await createClient();

    try {
        // 1. Traer item + checklist + documentos
        const { data: item, error: itemError } = await supabase
            .from('dossier_items')
            .select(`
                id,
                dossiers ( id, lab_id ),
                checklist_items ( code, module, title_i18n_json, description_i18n_json, ai_prompt, allows_multiple_files ),
                documents ( id, file_path, uploaded_at, version, status )
            `)
            .eq('id', dossierItemId)
            .single();

        if (itemError || !item) {
            throw new Error('Etapa no encontrada.');
        }

        const labId = (item as any).dossiers?.lab_id;
        const checkItem = (item as any).checklist_items;
        const docs = ((item as any).documents || [])
            .sort((a: any, b: any) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
        
        console.log(`📁 Documentos encontrados: ${docs.length}`, docs.map((d: any) => ({ id: d.id, status: d.status, path: d.file_path })));

        if (!labId) throw new Error('No se pudo identificar el laboratorio.');
        if (!checkItem) throw new Error('Checklist item no disponible.');
        if (!docs.length) throw new Error('No hay documentos para analizar en esta etapa.');

        const stageCode = checkItem.code || 'UNKNOWN';
        const stageName = checkItem.title_i18n_json?.es || stageCode;
        const stageDescription = checkItem.description_i18n_json?.es || '';
        const stageModule = checkItem.module || 'General';
        const isMultiFile = !!checkItem.allows_multiple_files || isMultiFileStage(stageCode);
        const customPrompt = checkItem.ai_prompt || null;

        // 2. Traer API Key del Lab
        const { data: lab, error: labError } = await supabase
            .from('labs')
            .select('openai_api_key')
            .eq('id', labId)
            .single();

        if (labError || !lab?.openai_api_key) {
            throw new Error('Lab sin OpenAI API Key configurada.');
        }

        // 3. Descargar y extraer texto de TODOS los documentos
        const fileNames: string[] = [];
        const parts: string[] = [];
        let hasOcrIssues = false;

        console.log(`📁 Analizando ${docs.length} archivos para etapa ${stageCode}...`);

        for (const d of docs) {
            const fileName = d.file_path.split('/').pop() || 'documento';
            fileNames.push(fileName);

            const { data: fileData, error: fileError } = await supabase.storage
                .from('dossier-documents')
                .download(d.file_path);

            if (fileError || !fileData) {
                parts.push(`\n\n### FILE: ${fileName}\n[ERROR: No se pudo descargar]\n`);
                continue;
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const filePathLower = d.file_path.toLowerCase();

            try {
                const { text, needsOcr } = await extractTextFromFile(buffer, filePathLower);
                
                if (needsOcr) {
                    hasOcrIssues = true;
                    parts.push(`\n\n### FILE_START: ${fileName}\n[ADVERTENCIA: PDF posiblemente escaneado - texto limitado]\n${text}\n### FILE_END: ${fileName}\n`);
                } else {
                    parts.push(`\n\n### FILE_START: ${fileName}\n${text}\n### FILE_END: ${fileName}\n`);
                }
                
                console.log(`  📄 ${fileName}: ${text.length} chars${needsOcr ? ' (posible OCR)' : ''}`);
            } catch (e: any) {
                parts.push(`\n\n### FILE: ${fileName}\n[ERROR EXTRACCIÓN: ${e.message}]\n`);
            }
        }

        const combinedContent = parts.join('\n');

        if (!combinedContent || combinedContent.trim().length < 100) {
            throw new Error('No se pudo extraer texto suficiente de los archivos. Posibles PDFs escaneados sin OCR.');
        }

        console.log(`📊 Total contenido combinado: ${combinedContent.length} chars de ${fileNames.length} archivos`);

        // 4. Llamar a OpenAI con prompt multi-archivo
        const openai = new OpenAI({ apiKey: lab.openai_api_key });

        const { systemPrompt, userPrompt } = buildCompletePrompt({
            stageCode,
            stageName,
            stageDescription,
            module: stageModule,
            isMultiFile: true, // Siempre true para análisis de item
            customPrompt,
            documentContent: combinedContent,
            fileNames
        });

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 3000
        });

        const content = completion.choices?.[0]?.message?.content;
        if (!content) throw new Error('La IA no devolvió respuesta.');

        const analysisJson = JSON.parse(content);

        // 5. Guardar análisis consolidado
        const userId = (await supabase.auth.getUser()).data.user?.id;
        
        const { data: saved, error: saveError } = await supabase
            .from('ai_item_analyses')
            .insert({
                dossier_item_id: dossierItemId,
                executed_by: userId,
                provider: 'openai',
                model: 'gpt-4o-mini',
                files_analyzed: fileNames,
                analysis_json: analysisJson,
                status: 'success',
                needs_ocr: hasOcrIssues
            })
            .select()
            .single();

        if (saveError) {
            console.error('Error guardando análisis:', saveError);
            throw new Error('Error al guardar el análisis: ' + saveError.message);
        }

        console.log(`✅ Análisis guardado para etapa ${stageCode} con ${fileNames.length} archivos`);

        return { success: true, data: saved };

    } catch (error: any) {
        console.error('AI Item Analysis Error:', error);
        return { success: false, error: error.message };
    }
}
