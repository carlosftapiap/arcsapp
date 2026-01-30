'use server';

import { createClient } from '@/lib/supabase/server';
import { OpenAI } from 'openai';

import pdfParse from '@/lib/pdf-parse';

/**
 * Configuración para auditoría de documentos grandes
 */
const AUDIT_CONFIG = {
    MAX_CHARS_PER_CHUNK: 30000,    // Máx caracteres por chunk para OpenAI
    MAX_TOKENS_RESPONSE: 4000,     // Máx tokens de respuesta
};

/**
 * Interfaces para resultados de auditoría
 */
export interface AuditResult {
    id?: string;
    total_pages: number;
    stages_found: StageFound[];
    problems_found: ProblemFound[];
    summary: string;
    processing_info: {
        chunks_processed: number;
        total_chars: number;
        processing_time_ms: number;
    };
}

export interface StageFound {
    stage_code: string;
    stage_name: string;
    pages: number[];
    page_range: string;
    status: 'complete' | 'incomplete' | 'missing_info';
    details: string;
}

export interface ProblemFound {
    type: 'critical' | 'warning' | 'info';
    description: string;
    page: number;
    stage_code?: string;
    recommendation: string;
}

/**
 * Prompt del sistema para auditoría ARCSA
 */
const AUDIT_SYSTEM_PROMPT = `Eres un auditor experto en documentación regulatoria farmacéutica para ARCSA (Ecuador).
Tu tarea es analizar un documento grande y:
1. Identificar EN QUÉ PÁGINAS se encuentra cada etapa/sección del dossier
2. Detectar PROBLEMAS, inconsistencias o información faltante
3. Indicar el número de página exacto donde se encuentra cada hallazgo

ETAPAS COMUNES DE UN DOSSIER ARCSA:
- A-01: Certificado BPM/GMP
- A-02: CPP (Certificado de Producto Farmacéutico) o CLV
- A-03: Certificado de Libre Venta
- A-04: Poder Legal / Carta de Autorización
- A-05: Contrato de Fabricación
- B-01: Certificado de Análisis (CoA)
- B-02: Especificaciones de Materia Prima / API
- B-03: Especificaciones de Producto Terminado
- B-04: Fórmula Cuali-Cuantitativa
- B-05: Proceso de Fabricación / Diagrama de Flujo
- B-06: Validación de Proceso
- B-07: Controles en Proceso
- B-08: Material de Empaque
- B-09: Metodología Analítica
- B-10: Validación de Métodos Analíticos
- C-01: Estudios de Estabilidad
- C-02: Conclusión de Vida Útil
- C-03: Condiciones de Almacenamiento
- D-01: Etiquetado / Artes Gráficos
- D-02: Inserto / Prospecto

IMPORTANTE:
- El texto incluye marcadores [PÁGINA X] que indican el número de página
- Indica SIEMPRE el número de página donde encontraste cada información
- Si una etapa abarca múltiples páginas, indica el rango (ej: "páginas 15-23")
- Clasifica problemas como: critical (bloquea trámite), warning (requiere atención), info (observación)
- Busca inconsistencias entre secciones (ej: fechas que no coinciden, lotes diferentes)

Responde SIEMPRE en JSON válido con esta estructura exacta:
{
    "stages_found": [
        {
            "stage_code": "A-01",
            "stage_name": "Certificado BPM",
            "pages": [5, 6, 7],
            "page_range": "5-7",
            "status": "complete",
            "details": "Certificado BPM emitido por INVIMA, vigente hasta 2025"
        }
    ],
    "problems_found": [
        {
            "type": "critical",
            "description": "Certificado BPM vencido",
            "page": 5,
            "stage_code": "A-01",
            "recommendation": "Solicitar certificado BPM actualizado al fabricante"
        }
    ],
    "chunk_summary": "Resumen breve de lo encontrado en este fragmento"
}`;

/**
 * Extrae texto de un PDF con marcadores de página
 */
async function extractTextWithPages(buffer: Buffer): Promise<{ text: string; totalPages: number }> {
    try {
        // Usar pdf-parse para obtener texto y número de páginas
        const data = await pdfParse(buffer);
        
        const totalPages = data.numpages || 1;
        const fullText = data.text || '';
        
        // Dividir el texto proporcionalmente y agregar marcadores de página
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
        
        console.log(`📄 PDF procesado: ${totalPages} páginas, ${fullText.length} caracteres`);
        
        return { text: textWithMarkers, totalPages };
        
    } catch (error: any) {
        console.error('Error extrayendo texto del PDF:', error);
        throw new Error('No se pudo extraer texto del PDF: ' + error.message);
    }
}

/**
 * Divide el texto en chunks manejables
 */
function splitIntoChunks(text: string): string[] {
    const chunks: string[] = [];
    
    if (text.length <= AUDIT_CONFIG.MAX_CHARS_PER_CHUNK) {
        return [text];
    }
    
    // Dividir por marcadores de página para mantener contexto
    const pageBlocks = text.split(/(?=\[PÁGINA \d+\])/);
    
    let currentChunk = '';
    
    for (const block of pageBlocks) {
        if ((currentChunk.length + block.length) > AUDIT_CONFIG.MAX_CHARS_PER_CHUNK) {
            if (currentChunk.length > 0) {
                chunks.push(currentChunk);
            }
            currentChunk = block;
        } else {
            currentChunk += block;
        }
    }
    
    if (currentChunk.length > 0) {
        chunks.push(currentChunk);
    }
    
    console.log(`📦 Texto dividido en ${chunks.length} chunks`);
    return chunks;
}

/**
 * Analiza un chunk con OpenAI
 */
async function analyzeChunk(
    openai: OpenAI,
    chunkText: string,
    chunkIndex: number,
    totalChunks: number
): Promise<{ stages: StageFound[]; problems: ProblemFound[]; summary: string }> {
    
    const userPrompt = `Analiza el siguiente fragmento del documento (Parte ${chunkIndex + 1} de ${totalChunks}).

DOCUMENTO:
${chunkText}

Identifica las etapas del dossier ARCSA presentes y cualquier problema encontrado.
Recuerda indicar el número de página exacto para cada hallazgo.`;

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: AUDIT_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: AUDIT_CONFIG.MAX_TOKENS_RESPONSE
        });

        const content = completion.choices?.[0]?.message?.content;
        if (!content) throw new Error('Sin respuesta de IA');

        const result = JSON.parse(content);
        
        return {
            stages: result.stages_found || [],
            problems: result.problems_found || [],
            summary: result.chunk_summary || ''
        };
        
    } catch (error: any) {
        console.error(`Error analizando chunk ${chunkIndex + 1}:`, error);
        return { stages: [], problems: [], summary: `Error en chunk ${chunkIndex + 1}: ${error.message}` };
    }
}

/**
 * Consolida resultados de múltiples chunks
 */
function consolidateResults(
    chunkResults: Array<{ stages: StageFound[]; problems: ProblemFound[]; summary: string }>
): { stages: StageFound[]; problems: ProblemFound[]; summary: string } {
    
    // Consolidar etapas (evitar duplicados, unir páginas)
    const stagesMap = new Map<string, StageFound>();
    
    for (const result of chunkResults) {
        for (const stage of result.stages) {
            const existing = stagesMap.get(stage.stage_code);
            if (existing) {
                // Unir páginas
                const allPages = [...new Set([...existing.pages, ...stage.pages])].sort((a, b) => a - b);
                existing.pages = allPages;
                existing.page_range = allPages.length > 1 
                    ? `${allPages[0]}-${allPages[allPages.length - 1]}`
                    : `${allPages[0]}`;
                // Concatenar detalles si son diferentes
                if (stage.details && !existing.details.includes(stage.details)) {
                    existing.details += '; ' + stage.details;
                }
                // Usar el peor status
                if (stage.status === 'missing_info' || existing.status === 'missing_info') {
                    existing.status = 'missing_info';
                } else if (stage.status === 'incomplete' || existing.status === 'incomplete') {
                    existing.status = 'incomplete';
                }
            } else {
                stagesMap.set(stage.stage_code, { ...stage });
            }
        }
    }
    
    // Consolidar problemas (evitar duplicados exactos)
    const problemsSet = new Set<string>();
    const uniqueProblems: ProblemFound[] = [];
    
    for (const result of chunkResults) {
        for (const problem of result.problems) {
            const key = `${problem.page}-${problem.description.substring(0, 50)}`;
            if (!problemsSet.has(key)) {
                problemsSet.add(key);
                uniqueProblems.push(problem);
            }
        }
    }
    
    // Ordenar problemas por tipo (critical primero) y luego por página
    uniqueProblems.sort((a, b) => {
        const typeOrder = { critical: 0, warning: 1, info: 2 };
        const typeCompare = typeOrder[a.type] - typeOrder[b.type];
        if (typeCompare !== 0) return typeCompare;
        return a.page - b.page;
    });
    
    // Crear resumen consolidado
    const summaries = chunkResults.map(r => r.summary).filter(s => s.length > 0);
    
    return {
        stages: Array.from(stagesMap.values()).sort((a, b) => a.stage_code.localeCompare(b.stage_code)),
        problems: uniqueProblems,
        summary: summaries.join(' | ')
    };
}

/**
 * Función principal de auditoría de PDF
 */
export async function runAuditAnalysis(
    fileBase64: string,
    fileName: string,
    labId?: string
): Promise<{ success: boolean; data?: AuditResult; error?: string }> {
    
    const startTime = Date.now();
    const supabase = await createClient();
    
    try {
        // 1. Obtener API key
        let apiKey = process.env.OPENAI_API_KEY;
        
        if (labId) {
            const { data: lab } = await supabase
                .from('labs')
                .select('openai_api_key')
                .eq('id', labId)
                .single();
            
            if (lab?.openai_api_key) {
                apiKey = lab.openai_api_key;
            }
        }
        
        if (!apiKey) {
            throw new Error('No se encontró API Key de OpenAI. Configure una en el laboratorio o en variables de entorno.');
        }
        
        const openai = new OpenAI({ apiKey });
        
        // 2. Extraer texto del PDF con marcadores de página
        const buffer = Buffer.from(fileBase64, 'base64');
        const { text, totalPages } = await extractTextWithPages(buffer);
        
        if (text.trim().length < 100) {
            throw new Error('No se pudo extraer suficiente texto del PDF. Puede ser un documento escaneado sin OCR.');
        }
        
        console.log(`📊 Iniciando auditoría: ${totalPages} páginas, ${text.length} caracteres`);
        
        // 3. Dividir en chunks
        const chunks = splitIntoChunks(text);
        
        // 4. Analizar cada chunk
        const chunkResults: Array<{ stages: StageFound[]; problems: ProblemFound[]; summary: string }> = [];
        
        for (let i = 0; i < chunks.length; i++) {
            console.log(`🔍 Analizando chunk ${i + 1}/${chunks.length}...`);
            const result = await analyzeChunk(openai, chunks[i], i, chunks.length);
            chunkResults.push(result);
        }
        
        // 5. Consolidar resultados
        const consolidated = consolidateResults(chunkResults);
        
        const processingTime = Date.now() - startTime;
        
        const auditResult: AuditResult = {
            total_pages: totalPages,
            stages_found: consolidated.stages,
            problems_found: consolidated.problems,
            summary: consolidated.summary,
            processing_info: {
                chunks_processed: chunks.length,
                total_chars: text.length,
                processing_time_ms: processingTime
            }
        };
        
        console.log(`✅ Auditoría completada en ${(processingTime / 1000).toFixed(1)}s`);
        console.log(`   - Etapas encontradas: ${auditResult.stages_found.length}`);
        console.log(`   - Problemas detectados: ${auditResult.problems_found.length}`);
        
        return { success: true, data: auditResult };
        
    } catch (error: any) {
        console.error('Error en auditoría:', error);
        return { success: false, error: error.message };
    }
}
