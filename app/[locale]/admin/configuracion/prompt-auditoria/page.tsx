'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, RefreshCw, CheckCircle2, FileSearch } from 'lucide-react';

const DEFAULT_AUDIT_PROMPT = `Eres un auditor experto en documentación regulatoria farmacéutica para ARCSA (Ecuador).
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

export default function PromptAuditoriaPage() {
    const [prompt, setPrompt] = useState(DEFAULT_AUDIT_PROMPT);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadPrompt = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('system_prompts')
                .select('prompt')
                .eq('key', 'audit_documents')
                .single();
            if (data?.prompt) setPrompt(data.prompt);
            setLoading(false);
        };
        loadPrompt();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase
            .from('system_prompts')
            .upsert({ 
                key: 'audit_documents', 
                name: 'Auditoría de Documentos',
                description: 'Prompt para análisis de documentos PDF',
                prompt: prompt 
            }, { onConflict: 'key' });
        
        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                    <FileSearch className="text-indigo-600" />
                    Prompt de Auditoría de Documentos
                </h1>
                <p className="text-gray-600 mt-1">
                    Configura el prompt que usa la IA para analizar PDFs y detectar etapas ARCSA.
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Este prompt se envía a la IA cuando se analiza un documento en la sección de Auditoría.
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all ${
                            saved 
                                ? 'bg-green-500 text-white' 
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        } disabled:opacity-50`}
                    >
                        {saving ? (
                            <><RefreshCw size={16} className="animate-spin" /> Guardando...</>
                        ) : saved ? (
                            <><CheckCircle2 size={16} /> Guardado</>
                        ) : (
                            <><Save size={16} /> Guardar Cambios</>
                        )}
                    </button>
                </div>
                
                <div className="p-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-96">
                            <RefreshCw className="animate-spin text-indigo-500" size={32} />
                        </div>
                    ) : (
                        <textarea
                            className="w-full h-[600px] border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm font-mono resize-none"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
