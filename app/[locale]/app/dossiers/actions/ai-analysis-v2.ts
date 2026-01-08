'use server';

import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { buildCompletePrompt, isMultiFileStage } from '@/lib/ai/prompts-arcsa';

/**
 * Análisis de documento usando OpenAI con input_file (soporta PDFs escaneados)
 * Esta versión envía los PDFs directamente a OpenAI sin usar pdf-parse
 */
export async function runAIAnalysisV2(documentId: string) {
    const supabase = await createClient();

    try {
        // 1) Traer documento + item + checklist
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
        const dossierItemId = (doc as any).dossier_item_id; // Usar el FK directo
        
        console.log(`🔍 Doc ID: ${documentId}, DossierItem ID: ${dossierItemId}, isMultiFile: ${!!checkItem?.allows_multiple_files}`);

        const stageCode = checkItem?.code || 'UNKNOWN';
        const stageName = checkItem?.title_i18n_json?.es || stageCode;
        const stageDescription = checkItem?.description_i18n_json?.es || '';
        const stageModule = checkItem?.module || 'General';
        const customPrompt = checkItem?.ai_prompt || null;

        const isMultiFile = !!checkItem?.allows_multiple_files || isMultiFileStage(stageCode);

        if (!labId) throw new Error('No se pudo identificar el laboratorio.');

        // 2) API key
        const { data: lab } = await supabase
            .from('labs')
            .select('openai_api_key')
            .eq('id', labId)
            .single();

        if (!lab?.openai_api_key) {
            throw new Error('No OpenAI API Key found for this lab.');
        }

        const openai = new OpenAI({ apiKey: lab.openai_api_key });

        // 3) Obtener lista de docs a analizar:
        // - si MULTI: todos los documents del dossier_item
        // - si SINGLE: solo este documentId
        let docsToAnalyze: { id: string; file_path: string }[] = [];

        if (isMultiFile && dossierItemId) {
            const { data: docs, error } = await supabase
                .from('documents')
                .select('id, file_path')
                .eq('dossier_item_id', dossierItemId)
                .order('uploaded_at', { ascending: true });

            if (error) throw error;
            docsToAnalyze = (docs || []) as any;
        } else {
            docsToAnalyze = [{ id: doc.id, file_path: doc.file_path }];
        }

        if (!docsToAnalyze.length) throw new Error('No hay archivos para analizar.');

        // Limitar a máx 5 PDFs por request para evitar límites de OpenAI
        if (docsToAnalyze.length > 5) {
            docsToAnalyze = docsToAnalyze.slice(0, 5);
            console.warn(`⚠️ Limitando análisis a 5 archivos de ${docsToAnalyze.length}`);
        }

        console.log(`📁 Analizando ${docsToAnalyze.length} archivo(s) para etapa ${stageCode}...`);

        // 4) Crear signed URLs para que OpenAI pueda descargar los PDFs
        const fileNames: string[] = [];
        const fileContents: { type: string; file_url?: string; text?: string }[] = [];

        for (const d of docsToAnalyze) {
            const fileName = d.file_path.split('/').pop() || 'documento.pdf';
            fileNames.push(fileName);

            const { data: signed, error: signErr } = await supabase.storage
                .from('dossier-documents')
                .createSignedUrl(d.file_path, 3600); // 1 hora de validez

            if (signErr || !signed?.signedUrl) {
                console.error(`❌ Error generando URL firmada para ${fileName}:`, signErr);
                fileContents.push({
                    type: 'text',
                    text: `[ERROR: No se pudo acceder al archivo ${fileName}]`
                });
                continue;
            }

            console.log(`✅ URL firmada generada para ${fileName}`);
            
            // OpenAI acepta PDFs via URL con type: "file"
            fileContents.push({
                type: 'file',
                file_url: signed.signedUrl
            });
        }

        // 5) Construir prompts ARCSA
        const { systemPrompt, userPrompt } = buildCompletePrompt({
            stageCode,
            stageName,
            stageDescription,
            module: stageModule,
            isMultiFile,
            customPrompt,
            documentContent: '', // Vacío porque el PDF viene adjunto
            fileNames
        });

        // 6) Llamada a OpenAI con PDFs adjuntos
        // Usamos chat.completions con el contenido del PDF como URL
        console.log(`🤖 Enviando ${fileContents.length} archivo(s) a OpenAI...`);

        const messages: any[] = [
            { role: 'system', content: systemPrompt },
            {
                role: 'user',
                content: [
                    { type: 'text', text: userPrompt },
                    ...fileContents.map(f => {
                        if (f.type === 'file' && f.file_url) {
                            return {
                                type: 'file',
                                file: {
                                    url: f.file_url
                                }
                            };
                        }
                        return { type: 'text', text: f.text || '' };
                    })
                ]
            }
        ];

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o', // gpt-4o soporta archivos PDF
            messages,
            response_format: { type: 'json_object' },
            max_tokens: 3000,
            temperature: 0.2
        });

        const out = completion.choices[0]?.message?.content?.trim();
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
                model: 'gpt-4o',
                analysis_json: analysisResult,
                alerts:
                    analysisResult.alertas ||
                    analysisResult.alerts ||
                    analysisResult.validaciones?.errores_criticos?.map((e: any) => ({
                        type: 'error',
                        message: e.detalle
                    })) ||
                    []
            })
            .select()
            .single();

        if (saveError) throw saveError;

        return { success: true, data: analysisData };

    } catch (error: any) {
        console.error('AI Analysis V2 Error:', error);
        return { success: false, error: error.message };
    }
}
