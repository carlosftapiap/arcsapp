'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
    ChevronRight, Bot, Save, X, FileText, AlertCircle, 
    CheckCircle2, RefreshCw, Link2, Eye, EyeOff 
} from 'lucide-react';

interface ChecklistItem {
    id: string;
    code: string;
    module: string;
    title_i18n_json: { es: string; en: string };
    ai_prompt: string | null;
    ai_cross_references: string[] | null;
    sort_order: number;
}

interface ChecklistTemplate {
    id: string;
    product_type: string;
    name: string;
    version: number;
    active: boolean;
    checklist_items: ChecklistItem[];
}

interface Props {
    initialTemplates: ChecklistTemplate[];
}

export default function PromptsIAClient({ initialTemplates }: Props) {
    const [templates] = useState<ChecklistTemplate[]>(initialTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);
    
    // Estado del editor
    const [editingPrompt, setEditingPrompt] = useState('');
    const [editingCrossRefs, setEditingCrossRefs] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Agrupar items por módulo
    const groupedItems = selectedTemplate?.checklist_items?.reduce((acc, item) => {
        const module = item.module || 'General';
        if (!acc[module]) acc[module] = [];
        acc[module].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>) || {};

    const moduleOrder = ['Legal', 'Quality', 'Calidad', 'Efficacy', 'Eficacia', 'Safety', 'Seguridad', 'General'];
    const sortedModules = Object.keys(groupedItems).sort((a, b) => {
        const idxA = moduleOrder.indexOf(a);
        const idxB = moduleOrder.indexOf(b);
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    const handleSelectItem = (item: ChecklistItem) => {
        setSelectedItem(item);
        setEditingPrompt(item.ai_prompt || '');
        setEditingCrossRefs(item.ai_cross_references?.join(', ') || '');
        setSaved(false);
        setPreviewMode(false);
    };

    const handleSavePrompt = async () => {
        if (!selectedItem) return;
        
        setSaving(true);
        const supabase = createClient();

        // Parsear cross references
        const crossRefs = editingCrossRefs
            .split(',')
            .map(ref => ref.trim())
            .filter(ref => ref.length > 0);

        const { error } = await supabase
            .from('checklist_items')
            .update({
                ai_prompt: editingPrompt || null,
                ai_cross_references: crossRefs.length > 0 ? crossRefs : null
            })
            .eq('id', selectedItem.id);

        if (error) {
            alert('Error al guardar: ' + error.message);
        } else {
            setSaved(true);
            // Actualizar estado local
            if (selectedTemplate) {
                const updatedItems = selectedTemplate.checklist_items.map(item =>
                    item.id === selectedItem.id
                        ? { ...item, ai_prompt: editingPrompt, ai_cross_references: crossRefs }
                        : item
                );
                setSelectedItem({ ...selectedItem, ai_prompt: editingPrompt, ai_cross_references: crossRefs });
            }
            setTimeout(() => setSaved(false), 3000);
        }
        
        setSaving(false);
    };

    const hasPrompt = (item: ChecklistItem) => !!item.ai_prompt && item.ai_prompt.trim().length > 0;

    return (
        <div className="flex h-[calc(100vh-180px)] gap-6">
            {/* Panel Izquierdo: Plantillas y Items */}
            <div className="w-1/3 flex flex-col gap-4">
                {/* Selector de Plantilla */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                        Seleccionar Plantilla
                    </label>
                    <select
                        className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={selectedTemplate?.id || ''}
                        onChange={(e) => {
                            const template = templates.find(t => t.id === e.target.value);
                            setSelectedTemplate(template || null);
                            setSelectedItem(null);
                        }}
                    >
                        <option value="">-- Selecciona una plantilla --</option>
                        {templates.map(template => (
                            <option key={template.id} value={template.id}>
                                {template.name} (v{template.version})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Lista de Items */}
                {selectedTemplate && (
                    <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <h3 className="font-semibold text-gray-700 flex items-center text-sm">
                                <FileText size={16} className="mr-2" />
                                Requisitos ({selectedTemplate.checklist_items?.length || 0})
                            </h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto">
                            {sortedModules.map(moduleName => (
                                <div key={moduleName}>
                                    <div className="px-3 py-2 bg-gray-100 text-xs font-bold text-gray-600 uppercase tracking-wide sticky top-0">
                                        {moduleName}
                                    </div>
                                    {groupedItems[moduleName]
                                        .sort((a, b) => a.sort_order - b.sort_order)
                                        .map(item => (
                                            <div
                                                key={item.id}
                                                onClick={() => handleSelectItem(item)}
                                                className={`
                                                    px-3 py-2.5 cursor-pointer border-b border-gray-100 flex items-center gap-2
                                                    transition-colors
                                                    ${selectedItem?.id === item.id 
                                                        ? 'bg-blue-50 border-l-4 border-l-blue-500' 
                                                        : 'hover:bg-gray-50 border-l-4 border-l-transparent'}
                                                `}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                                                            {item.code}
                                                        </span>
                                                        {hasPrompt(item) ? (
                                                            <span title="Prompt configurado"><Bot size={14} className="text-green-500" /></span>
                                                        ) : (
                                                            <span title="Sin prompt"><Bot size={14} className="text-gray-300" /></span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-700 mt-1 truncate">
                                                        {item.title_i18n_json?.es || item.code}
                                                    </p>
                                                </div>
                                                {selectedItem?.id === item.id && (
                                                    <ChevronRight size={16} className="text-blue-400 flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Panel Derecho: Editor de Prompt */}
            <div className="w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
                {selectedItem ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-mono bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold">
                                            {selectedItem.code}
                                        </span>
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                            {selectedItem.module}
                                        </span>
                                    </div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {selectedItem.title_i18n_json?.es}
                                    </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPreviewMode(!previewMode)}
                                        className={`p-2 rounded-lg transition-colors ${
                                            previewMode 
                                                ? 'bg-purple-100 text-purple-700' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                        title={previewMode ? 'Modo edición' : 'Vista previa'}
                                    >
                                        {previewMode ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button
                                        onClick={handleSavePrompt}
                                        disabled={saving}
                                        className={`
                                            px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-all
                                            ${saved 
                                                ? 'bg-green-500 text-white' 
                                                : 'bg-blue-600 text-white hover:bg-blue-700'}
                                            disabled:opacity-50
                                        `}
                                    >
                                        {saving ? (
                                            <><RefreshCw size={16} className="animate-spin" /> Guardando...</>
                                        ) : saved ? (
                                            <><CheckCircle2 size={16} /> Guardado</>
                                        ) : (
                                            <><Save size={16} /> Guardar Prompt</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Editor Content */}
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {/* Referencias Cruzadas */}
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                    <Link2 size={14} />
                                    Referencias Cruzadas (códigos separados por coma)
                                </label>
                                <input
                                    type="text"
                                    className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                                    placeholder="Ej: A-02, B-04, C-05"
                                    value={editingCrossRefs}
                                    onChange={(e) => setEditingCrossRefs(e.target.value)}
                                />
                                <p className="text-xs text-gray-400 mt-1">
                                    Códigos de otros documentos que deben validarse junto con este.
                                </p>
                            </div>

                            {/* Prompt Editor */}
                            <div className="flex-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mb-2">
                                    <Bot size={14} />
                                    Prompt de Validación IA
                                </label>
                                
                                {previewMode ? (
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[400px] whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                        {editingPrompt || <span className="text-gray-400 italic">Sin prompt configurado</span>}
                                    </div>
                                ) : (
                                    <textarea
                                        className="w-full h-[400px] border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm font-mono resize-none"
                                        placeholder={`Escribe aquí el prompt de validación para este documento...

Ejemplo:
Eres un experto regulatorio farmacéutico validando un [TIPO DE DOCUMENTO].

VALIDAR OBLIGATORIAMENTE:
1. [Criterio 1]
2. [Criterio 2]
...

CRITERIOS DE VIGENCIA:
- [Regla de vigencia]

ALERTAS CRÍTICAS:
- ERROR si [condición grave]
- WARNING si [condición menor]

REFERENCIAS CRUZADAS: Debe coincidir con [otros códigos]`}
                                        value={editingPrompt}
                                        onChange={(e) => setEditingPrompt(e.target.value)}
                                    />
                                )}
                            </div>

                            {/* Tips */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1 mb-2">
                                    <AlertCircle size={14} />
                                    Guía para escribir prompts efectivos
                                </h4>
                                <ul className="text-xs text-amber-700 space-y-1">
                                    <li>• <strong>VALIDAR OBLIGATORIAMENTE:</strong> Lista los elementos que la IA debe buscar en el documento.</li>
                                    <li>• <strong>CRITERIOS DE VIGENCIA:</strong> Define reglas de fechas (vencimiento, antigüedad máxima).</li>
                                    <li>• <strong>ALERTAS CRÍTICAS:</strong> Usa ERROR para bloquear, WARNING para advertir.</li>
                                    <li>• <strong>REFERENCIAS CRUZADAS:</strong> Indica con qué otros documentos debe coincidir.</li>
                                </ul>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Bot size={40} className="text-purple-400" />
                        </div>
                        <p className="font-medium text-gray-500 text-lg">Editor de Prompts IA</p>
                        <p className="text-sm mt-2 max-w-md text-center text-gray-400">
                            Selecciona una plantilla y luego un requisito para configurar el prompt de validación inteligente.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
