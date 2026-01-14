'use server';

import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { buildCompletePrompt, isMultiFileStage } from '@/lib/ai/prompts-arcsa';
// @ts-ignore
const mammoth = require('mammoth');
// @ts-ignore
const pdfParse = require('pdf-parse');

/**
 * Análisis de documento usando OpenAI Responses API con input_file
 * Soporta PDFs escaneados y multi-archivo por etapa
 */
export async function runAIAnalysis(documentId: string) {
    const supabase = await createClient();

    try {
        // 1) Documento + item + checklist
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select(`
                id, file_path, dossier_item_id,
                dossier_items (
                    id,
                    dossiers ( id, lab_id ),
                    checklist_items ( code, module, title_i18n_json, description_i18n_json, ai_prompt, allows_multiple_files )
                )
            `)
            .eq('id', documentId)
            .single();

        if (docError || !doc) throw new Error('Documento no encontrado o sin permisos.');

        const dossierItem = doc.dossier_items as any;
        const labId = dossierItem?.dossiers?.lab_id;
        const checkItem = dossierItem?.checklist_items;
        const dossierItemId = (doc as any).dossier_item_id;

        const stageCode = checkItem?.code || 'UNKNOWN';
        const stageName = checkItem?.title_i18n_json?.es || stageCode;
        const stageDescription = checkItem?.description_i18n_json?.es || '';
        const stageModule = checkItem?.module || 'General';
        const customPrompt = checkItem?.ai_prompt || null;

        const isMultiFile = !!checkItem?.allows_multiple_files || isMultiFileStage(stageCode);

        if (!labId) throw new Error('No se pudo identificar el laboratorio.');

        // 2) API key
        const { data: lab, error: labError } = await supabase
            .from('labs')
            .select('openai_api_key')
            .eq('id', labId)
            .single();

        if (labError || !lab?.openai_api_key) {
            throw new Error('No OpenAI API Key found. Configure la key del laboratorio.');
        }

        const client = new OpenAI({ apiKey: lab.openai_api_key });

        // 3) Si es MULTI: traer todos los docs del item; si no: solo el actual
        let docsToAnalyze: { id: string; file_path: string }[] = [];

        if (isMultiFile && dossierItemId) {
            const { data: docs, error } = await supabase
                .from('documents')
                .select('id, file_path')
                .eq('dossier_item_id', dossierItemId)
                .order('uploaded_at', { ascending: true });

            if (error) throw error;
            docsToAnalyze = (docs || []) as any;
            console.log(`📁 Etapa MULTI (${stageCode}): encontrados ${docsToAnalyze.length} archivos`);
        } else {
            docsToAnalyze = [{ id: doc.id, file_path: doc.file_path }];
            console.log(`📁 Etapa SINGLE (${stageCode}): 1 archivo`);
        }

        if (!docsToAnalyze.length) throw new Error('No hay archivos para analizar.');

        // 4) Descargar cada archivo y extraer texto
        const fileNames: string[] = [];
        const textParts: string[] = [];

        for (const d of docsToAnalyze) {
            const fileName = d.file_path.split('/').pop() || 'documento.pdf';
            fileNames.push(fileName);

            const { data: fileData, error: fileError } = await supabase.storage
                .from('dossier-documents')
                .download(d.file_path);

            if (fileError || !fileData) {
                console.error(`❌ Error descargando ${fileName}:`, fileError);
                textParts.push(`\n### FILE: ${fileName}\n[ERROR: No se pudo descargar]\n`);
                continue;
            }

            const arrayBuffer = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const lower = d.file_path.toLowerCase();

            try {
                let extractedText = '';
                
                if (lower.endsWith('.pdf')) {
                    const pdfData = await pdfParse(buffer);
                    extractedText = (pdfData.text || '').slice(0, 15000);
                    console.log(`✅ PDF extraído: ${fileName} (${extractedText.length} chars)`);
                } else if (lower.endsWith('.docx')) {
                    const result = await mammoth.extractRawText({ buffer });
                    extractedText = (result.value || '').slice(0, 15000);
                    console.log(`✅ DOCX extraído: ${fileName} (${extractedText.length} chars)`);
                } else {
                    extractedText = `[Formato no soportado: ${fileName}]`;
                }
                
                if (extractedText.trim().length < 50) {
                    textParts.push(`\n### FILE: ${fileName}\n[ADVERTENCIA: PDF posiblemente escaneado - texto muy limitado]\n${extractedText}\n`);
                } else {
                    textParts.push(`\n### FILE_START: ${fileName}\n${extractedText}\n### FILE_END: ${fileName}\n`);
                }
            } catch (extractError: any) {
                console.error(`❌ Error extrayendo ${fileName}:`, extractError);
                textParts.push(`\n### FILE: ${fileName}\n[ERROR EXTRACCIÓN: ${extractError.message}]\n`);
            }
        }
        
        const combinedContent = textParts.join('\n');

        // 5) Validar contenido extraído
        if (!combinedContent || combinedContent.trim().length < 100) {
            throw new Error('No se pudo extraer texto suficiente de los archivos. Posibles PDFs escaneados sin OCR.');
        }

        // 6) Prompt ARCSA
        const { systemPrompt, userPrompt } = buildCompletePrompt({
            stageCode,
            stageName,
            stageDescription,
            module: stageModule,
            isMultiFile,
            customPrompt,
            documentContent: combinedContent,
            fileNames
        });

        console.log(`🤖 Enviando ${fileNames.length} archivo(s) a OpenAI (${combinedContent.length} chars)...`);

        // 7) Chat Completions API
        const resp = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 4000
        });

        const out = resp.choices[0]?.message?.content?.trim();
        if (!out) throw new Error('La IA no devolvió respuesta.');

        console.log(`✅ Respuesta recibida de OpenAI`);
        const analysisResult = JSON.parse(out);

        // 7) Guardar resultado
        const { data: analysisData, error: saveError } = await supabase
            .from('ai_document_analyses')
            .insert({
                document_id: documentId,
                executed_by: (await supabase.auth.getUser()).data.user?.id,
                status: 'success',
                provider: 'openai',
                model: 'gpt-4o-mini',
                analysis_json: {
                    ...analysisResult,
                    _meta: {
                        stageCode,
                        isMultiFile,
                        filesAnalyzed: fileNames
                    }
                },
                alerts:
                    analysisResult.alertas ||
                    analysisResult.alerts ||
                    analysisResult.validaciones?.errores_criticos?.map((e: any) => ({ type: 'error', message: e.detalle })) ||
                    []
            })
            .select()
            .single();

        if (saveError) throw saveError;

        return { success: true, data: analysisData };

    } catch (error: any) {
        console.error('AI Analysis Error:', error);
        return { success: false, error: error.message };
    }
}
