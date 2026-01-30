import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';
import { randomUUID } from 'crypto';

import pdfParse from '@/lib/pdf-parse';

export const maxDuration = 300; // 5 minutos para documentos grandes

const STORAGE_BUCKET = 'audit-documents';

const AUDIT_CONFIG = {
    MAX_CHARS_PER_CHUNK: 30000,
    MAX_TOKENS_RESPONSE: 4000,
};

const AUDIT_SYSTEM_PROMPT = `Eres un auditor experto en documentación regulatoria farmacéutica para ARCSA (Ecuador).
Tu tarea es analizar un documento grande y:
1. Identificar EN QUÉ PÁGINAS se encuentra cada etapa/sección del dossier
2. Detectar PROBLEMAS, inconsistencias o información faltante
3. Indicar el número de página exacto donde se encuentra cada hallazgo
4. IDENTIFICAR QUÉ ETAPAS/DOCUMENTOS FALTAN del checklist requerido

ETAPAS REQUERIDAS PARA UN DOSSIER ARCSA (CHECKLIST COMPLETO):

MÓDULO LEGAL (A):
- A-01: Certificado BPM/GMP (REQUERIDO)
- A-02: CPP (Certificado de Producto Farmacéutico) (REQUERIDO)
- A-03: Certificado de Libre Venta (REQUERIDO)
- A-04: Poder Legal / Carta de Autorización (REQUERIDO)

MÓDULO CALIDAD (B):
- B-01: Certificado de Análisis de Producto Terminado (CoA) (REQUERIDO)
- B-02: Certificados de Análisis de Materia Prima / API (REQUERIDO)
- B-03: Especificaciones de Calidad de Producto Terminado (REQUERIDO)
- B-04: Fórmula Cualicuantitativa Completa (Unidades SI) (REQUERIDO)
- B-05: Justificación de la Fórmula Cualitativa (REQUERIDO)
- B-06: Declaración de Excipientes y Colorantes Autorizados (REQUERIDO)
- B-07: Descripción del Proceso de Manufactura (REQUERIDO)
- B-08: Flujograma del Proceso de Manufactura (REQUERIDO)
- B-09: Metodología Analítica y Validación (REQUERIDO)
- B-10: Interpretación del Código de Lote (REQUERIDO)
- B-11: Descripción de Envase Primario y Secundario (REQUERIDO)

MÓDULO ESTABILIDAD (C):
- C-01: Estudios de Estabilidad (Larga duración y Acelerada) (REQUERIDO)
- C-02: Protocolo de Estabilidad y Conclusión de Vida Útil (REQUERIDO)
- C-03: Cromatogramas / Registros Analíticos (REQUERIDO)

MÓDULO EFICACIA (D):
- C-04: Documentación de Soporte Clínico / Farmacológico (REQUERIDO)

MÓDULO GENERAL (E):
- C-05: Etiquetas Originales del País de Origen (REQUERIDO)

IMPORTANTE:
- El texto incluye marcadores [PÁGINA X] que indican el número de página
- Indica SIEMPRE el número de página donde encontraste cada información
- Si una etapa abarca múltiples páginas, indica el rango (ej: "páginas 15-23")
- Clasifica problemas como: critical (bloquea trámite), warning (requiere atención), info (observación)
- DEBES indicar las etapas que NO encontraste en el documento en "stages_missing"

Responde SIEMPRE en JSON válido con esta estructura exacta:
{
    "stages_found": [
        {
            "stage_code": "A-01",
            "stage_name": "Certificado BPM",
            "pages": [5, 6, 7],
            "page_range": "5-7",
            "status": "complete",
            "details": "Descripción breve"
        }
    ],
    "stages_missing": [
        {
            "stage_code": "B-05",
            "stage_name": "Justificación de la Fórmula Cualitativa",
            "module": "Calidad",
            "is_required": true
        }
    ],
    "problems_found": [
        {
            "type": "critical",
            "description": "Descripción del problema",
            "page": 15,
            "stage_code": "A-01",
            "recommendation": "Qué hacer para corregirlo"
        }
    ],
    "chunk_summary": "Resumen breve"
}`;

async function extractTextWithPages(buffer: Buffer): Promise<{ text: string; totalPages: number }> {
    try {
        const data = await pdfParse(buffer);
        const totalPages = data.numpages || 1;
        const fullText = data.text || '';
        
        const avgCharsPerPage = Math.ceil(fullText.length / totalPages);
        let textWithMarkers = '';
        
        for (let i = 0; i < totalPages; i++) {
            const start = i * avgCharsPerPage;
            const end = Math.min((i + 1) * avgCharsPerPage, fullText.length);
            const pageText = fullText.substring(start, end).trim();
            if (pageText.length > 0) {
                textWithMarkers += `\n\n[PÁGINA ${i + 1}]\n${pageText}`;
            }
        }
        
        return { text: textWithMarkers, totalPages };
    } catch (error: any) {
        throw new Error('No se pudo extraer texto del PDF: ' + error.message);
    }
}

function splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    if (text.length <= AUDIT_CONFIG.MAX_CHARS_PER_CHUNK) {
        return [text];
    }
    
    const pageBlocks = text.split(/(?=\[PÁGINA \d+\])/);
    let currentChunk = '';
    
    for (const block of pageBlocks) {
        if ((currentChunk.length + block.length) > AUDIT_CONFIG.MAX_CHARS_PER_CHUNK) {
            if (currentChunk.length > 0) chunks.push(currentChunk);
            currentChunk = block;
        } else {
            currentChunk += block;
        }
    }
    if (currentChunk.length > 0) chunks.push(currentChunk);
    
    return chunks;
}

async function analyzeChunk(openai: OpenAI, chunkText: string, chunkIndex: number, totalChunks: number, systemPrompt: string) {
    const userPrompt = `Analiza el siguiente fragmento del documento (Parte ${chunkIndex + 1} de ${totalChunks}).

DOCUMENTO:
${chunkText}

Identifica las etapas del dossier ARCSA presentes y cualquier problema encontrado.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: AUDIT_CONFIG.MAX_TOKENS_RESPONSE
        });

        const content = completion.choices?.[0]?.message?.content;
        if (!content) throw new Error('Sin respuesta de IA');
        return JSON.parse(content);
    } catch (error: any) {
        console.error(`Error analizando chunk ${chunkIndex + 1}:`, error);
        return { stages_found: [], problems_found: [], chunk_summary: `Error: ${error.message}` };
    }
}

export async function POST(request: NextRequest) {
    const startTime = Date.now();
    
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const productName = formData.get('productName') as string;
        const manufacturer = formData.get('manufacturer') as string || '';
        const formLabId = formData.get('labId') as string || '';
        const formProductId = formData.get('productId') as string || '';
        
        if (!file) {
            return NextResponse.json({ success: false, error: 'No se recibió archivo' }, { status: 400 });
        }
        
        if (!productName) {
            return NextResponse.json({ success: false, error: 'Seleccione un producto' }, { status: 400 });
        }

        console.log(`📄 Archivo recibido: ${file.name}, ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        console.log(`💊 Medicamento: ${productName}${manufacturer ? ` - ${manufacturer}` : ''}`);

        // Obtener API key y datos del usuario
        const supabase = await createClient();
        let apiKey = process.env.OPENAI_API_KEY;
        let labId: string | null = formLabId || null;
        let productId: string | null = formProductId || null;
        let userId: string | null = null;
        
        // Obtener usuario autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            userId = user.id;
        }
        
        // Si se envió labId, intentar obtener API key del laboratorio
        if (labId) {
            const { data: labData } = await supabase
                .from('labs')
                .select('openai_api_key')
                .eq('id', labId)
                .single();
            
            if (labData?.openai_api_key) {
                apiKey = labData.openai_api_key;
            }
        }
        
        if (!apiKey) {
            return NextResponse.json({ 
                success: false, 
                error: 'No se encontró API Key de OpenAI' 
            }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey });

        // Extraer texto del PDF
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { text, totalPages } = await extractTextWithPages(buffer);
        
        if (text.trim().length < 100) {
            return NextResponse.json({ 
                success: false, 
                error: 'No se pudo extraer suficiente texto del PDF. Puede ser escaneado sin OCR.' 
            }, { status: 400 });
        }

        console.log(`📊 PDF procesado: ${totalPages} páginas, ${text.length} caracteres`);

        // Obtener prompt de auditoría desde la base de datos
        let auditSystemPrompt = AUDIT_SYSTEM_PROMPT; // fallback al hardcoded
        const { data: promptData } = await supabase
            .from('system_prompts')
            .select('prompt')
            .eq('key', 'audit_documents')
            .single();
        
        if (promptData?.prompt) {
            auditSystemPrompt = promptData.prompt;
            console.log('📝 Usando prompt personalizado desde BD');
        } else {
            console.log('📝 Usando prompt por defecto');
        }

        // Dividir en chunks y analizar
        const chunks = splitIntoChunks(text);
        console.log(`📦 Dividido en ${chunks.length} chunks`);

        const allStages: any[] = [];
        const allProblems: any[] = [];
        const allMissingStages: any[] = [];
        const summaries: string[] = [];

        for (let i = 0; i < chunks.length; i++) {
            console.log(`🔍 Analizando chunk ${i + 1}/${chunks.length}...`);
            const result = await analyzeChunk(openai, chunks[i], i, chunks.length, auditSystemPrompt);
            
            if (result.stages_found) allStages.push(...result.stages_found);
            if (result.problems_found) allProblems.push(...result.problems_found);
            if (result.stages_missing) allMissingStages.push(...result.stages_missing);
            if (result.chunk_summary) summaries.push(result.chunk_summary);
        }

        // Consolidar etapas (eliminar duplicados)
        const stagesMap = new Map();
        for (const stage of allStages) {
            const existing = stagesMap.get(stage.stage_code);
            if (existing) {
                const allPages = [...new Set([...existing.pages, ...stage.pages])].sort((a, b) => a - b);
                existing.pages = allPages;
                existing.page_range = allPages.length > 1 ? `${allPages[0]}-${allPages[allPages.length - 1]}` : `${allPages[0]}`;
            } else {
                stagesMap.set(stage.stage_code, { ...stage });
            }
        }

        // Consolidar problemas (eliminar duplicados)
        const problemsSet = new Set<string>();
        const uniqueProblems: any[] = [];
        for (const problem of allProblems) {
            const key = `${problem.page}-${problem.description?.substring(0, 50)}`;
            if (!problemsSet.has(key)) {
                problemsSet.add(key);
                uniqueProblems.push(problem);
            }
        }

        // Consolidar etapas faltantes (eliminar las que ya fueron encontradas y duplicados)
        const foundCodes = new Set(Array.from(stagesMap.keys()));
        const missingMap = new Map();
        for (const missing of allMissingStages) {
            if (!foundCodes.has(missing.stage_code) && !missingMap.has(missing.stage_code)) {
                missingMap.set(missing.stage_code, missing);
            }
        }
        const stagesMissingArray = Array.from(missingMap.values()).sort((a, b) => a.stage_code.localeCompare(b.stage_code));

        const processingTime = Date.now() - startTime;

        const stagesArray = Array.from(stagesMap.values()).sort((a, b) => a.stage_code.localeCompare(b.stage_code));
        const problemsArray = uniqueProblems.sort((a, b) => {
            const typeOrder: any = { critical: 0, warning: 1, info: 2 };
            return (typeOrder[a.type] || 2) - (typeOrder[b.type] || 2);
        });

        // Subir archivo a Storage
        let filePath: string | null = null;
        const fileId = randomUUID();
        const storagePath = `${labId || 'general'}/${fileId}_${file.name}`;
        
        try {
            const { error: uploadError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .upload(storagePath, buffer, {
                    contentType: 'application/pdf',
                    upsert: false
                });
            
            if (!uploadError) {
                filePath = storagePath;
                console.log(`📁 Archivo guardado en Storage: ${storagePath}`);
            } else {
                console.warn('⚠️ No se pudo guardar en Storage:', uploadError.message);
            }
        } catch (storageError) {
            console.warn('⚠️ Error al subir a Storage:', storageError);
        }

        // Guardar resultados en la base de datos
        let auditId: string | null = null;
        try {
            const { data: insertedAudit, error: insertError } = await supabase
                .from('audits')
                .insert({
                    lab_id: labId,
                    user_id: userId,
                    product_id: productId,
                    product_name: productName,
                    manufacturer: manufacturer || null,
                    file_name: file.name,
                    file_path: filePath,
                    file_size_bytes: file.size,
                    total_pages: totalPages,
                    stages_found: stagesArray,
                    stages_missing: stagesMissingArray,
                    problems_found: problemsArray,
                    summary: summaries.join(' | '),
                    chunks_processed: chunks.length,
                    total_chars: text.length,
                    processing_time_ms: processingTime,
                    status: 'completed'
                })
                .select('id')
                .single();
            
            if (!insertError && insertedAudit) {
                auditId = insertedAudit.id;
                console.log(`💾 Auditoría guardada en BD: ${auditId}`);
            } else {
                console.warn('⚠️ No se pudo guardar en BD:', insertError?.message);
            }
        } catch (dbError) {
            console.warn('⚠️ Error al guardar en BD:', dbError);
        }

        const result = {
            id: auditId,
            product_name: productName,
            manufacturer: manufacturer,
            total_pages: totalPages,
            stages_found: stagesArray,
            stages_missing: stagesMissingArray,
            problems_found: problemsArray,
            summary: summaries.join(' | '),
            processing_info: {
                chunks_processed: chunks.length,
                total_chars: text.length,
                processing_time_ms: processingTime
            }
        };

        console.log(`✅ Auditoría completada en ${(processingTime / 1000).toFixed(1)}s`);

        return NextResponse.json({ success: true, data: result });

    } catch (error: any) {
        console.error('Error en auditoría:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
