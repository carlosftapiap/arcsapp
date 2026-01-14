'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Edit, ChevronRight, ClipboardList, Save, X, GripVertical, CheckCircle2, AlertCircle } from 'lucide-react';

interface ChecklistTemplate {
    id: string;
    product_type: string;
    name: string;
    version: number;
    active: boolean;
    created_at: string;
}

interface ChecklistItem {
    id: string;
    template_id: string;
    code: string;
    module: string;
    title_i18n_json: { es: string; en: string };
    description_i18n_json?: { es: string; en: string };
    required: boolean;
    critical: boolean;
    sort_order: number;
}

interface Props {
    initialTemplates: ChecklistTemplate[];
}

export default function TemplatesClient({ initialTemplates }: Props) {
    const t = useTranslations();
    const [templates, setTemplates] = useState<ChecklistTemplate[]>(initialTemplates);
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [templateItems, setTemplateItems] = useState<ChecklistItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    // Estado Form Plantilla
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const [newTemplateData, setNewTemplateData] = useState({
        name: '',
        product_type: 'medicine_general',
        version: 1,
        active: true
    });

    // Estado Form Item
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
    const [itemFormData, setItemFormData] = useState({
        code: '',
        module: 'General',
        title_es: '',
        title_en: '',
        required: true,
        critical: false,
        sort_order: 0
    });

    useEffect(() => {
        if (selectedTemplate) {
            loadItems(selectedTemplate.id);
        } else {
            setTemplateItems([]);
        }
    }, [selectedTemplate]);

    const loadItems = async (templateId: string) => {
        setLoadingItems(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('template_id', templateId)
            .order('sort_order', { ascending: true });

        if (data) setTemplateItems(data);
        setLoadingItems(false);
    };

    // --- TEMPLATE HANDLERS ---

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();

        const { data, error } = await supabase
            .from('checklist_templates')
            .insert([newTemplateData])
            .select()
            .single();

        if (error) {
            alert('Error creating template: ' + error.message);
            return;
        }

        if (data) {
            setTemplates([data, ...templates]);
            setShowTemplateForm(false);
            setNewTemplateData({ name: '', product_type: 'medicine_general', version: 1, active: true });
            setSelectedTemplate(data);
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Are you sure? This will delete the template and ALL its items.')) return;

        const supabase = createClient();
        const { error } = await supabase.from('checklist_templates').delete().eq('id', id);

        if (error) {
            alert('Error deleting: ' + error.message);
        } else {
            setTemplates(templates.filter(t => t.id !== id));
            if (selectedTemplate?.id === id) setSelectedTemplate(null);
        }
    };

    // --- ITEM HANDLERS ---

    const openItemForm = (item?: ChecklistItem) => {
        if (item) {
            setEditingItem(item);
            setItemFormData({
                code: item.code,
                module: item.module,
                title_es: item.title_i18n_json?.es || '',
                title_en: item.title_i18n_json?.en || '',
                required: item.required,
                critical: item.critical,
                sort_order: item.sort_order
            });
        } else {
            setEditingItem(null);
            // Auto-increment sort order
            const nextOrder = templateItems.length > 0
                ? Math.max(...templateItems.map(i => i.sort_order)) + 10
                : 10;

            setItemFormData({
                code: '',
                module: 'General',
                title_es: '',
                title_en: '',
                required: true,
                critical: false,
                sort_order: nextOrder
            });
        }
        setShowItemForm(true);
    };

    const handleSaveItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTemplate) return;

        const supabase = createClient();
        const payload = {
            template_id: selectedTemplate.id,
            code: itemFormData.code,
            module: itemFormData.module,
            title_i18n_json: {
                es: itemFormData.title_es,
                en: itemFormData.title_en || itemFormData.title_es
            },
            required: itemFormData.required,
            critical: itemFormData.critical,
            sort_order: itemFormData.sort_order
        };

        if (editingItem) {
            const { error } = await supabase
                .from('checklist_items')
                .update(payload)
                .eq('id', editingItem.id);

            if (error) alert('Error updating: ' + error.message);
            else {
                await loadItems(selectedTemplate.id);
                setShowItemForm(false);
            }
        } else {
            const { error } = await supabase
                .from('checklist_items')
                .insert([payload]);

            if (error) alert('Error creating: ' + error.message);
            else {
                await loadItems(selectedTemplate.id);
                setShowItemForm(false);
            }
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (!confirm('Eliminar este ítem?')) return;
        const supabase = createClient();
        const { error } = await supabase.from('checklist_items').delete().eq('id', id);
        if (error) alert('Error: ' + error.message);
        else if (selectedTemplate) loadItems(selectedTemplate.id);
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6">
            {/* Sidebar: Lista de Plantillas */}
            <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="font-semibold text-gray-700 flex items-center">
                        <ClipboardList size={20} className="mr-2" />
                        Plantillas
                    </h2>
                    <button
                        onClick={() => setShowTemplateForm(true)}
                        className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Nueva Plantilla"
                    >
                        <Plus size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {showTemplateForm && (
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mb-2">
                            <h3 className="text-sm font-semibold mb-2">Nueva Plantilla</h3>
                            <form onSubmit={handleCreateTemplate} className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Nombre de plantilla"
                                    className="w-full text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                                    value={newTemplateData.name}
                                    onChange={e => setNewTemplateData({ ...newTemplateData, name: e.target.value })}
                                    required
                                />
                                <div className="flex gap-2">
                                    <select
                                        className="text-sm border-gray-300 rounded flex-1"
                                        value={newTemplateData.product_type}
                                        onChange={e => setNewTemplateData({ ...newTemplateData, product_type: e.target.value })}
                                    >
                                        <option value="medicine_general">Medicamento</option>
                                        <option value="biologic">Biológico</option>
                                        <option value="device_medical">Disp. Médico</option>
                                        <option value="supplement_food">Suplemento Alimenticio</option>
                                    </select>
                                    <input
                                        type="number"
                                        className="w-16 text-sm border-gray-300 rounded"
                                        placeholder="Ver."
                                        value={newTemplateData.version}
                                        onChange={e => setNewTemplateData({ ...newTemplateData, version: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowTemplateForm(false)}
                                        className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 rounded"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                        Crear
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {templates.map(template => (
                        <div
                            key={template.id}
                            onClick={() => setSelectedTemplate(template)}
                            className={`
                                p-3 rounded-lg cursor-pointer border transition-all relative group
                                ${selectedTemplate?.id === template.id
                                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                                    : 'bg-white border-transparent hover:bg-gray-50 border-gray-100'}
                            `}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`font-medium text-sm ${selectedTemplate?.id === template.id ? 'text-blue-800' : 'text-gray-800'}`}>
                                        {template.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                            v{template.version}
                                        </span>
                                        <span className="text-xs text-gray-500 capitalize">
                                            {template.product_type.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            {selectedTemplate?.id === template.id && (
                                <ChevronRight size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-400" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Content: Editor de Items */}
            <div className="w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col relative">
                {selectedTemplate ? (
                    <>
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">{selectedTemplate.name}</h1>
                                <p className="text-xs text-gray-500">
                                    {templateItems.length} requisitos configurados
                                </p>
                            </div>
                            <button
                                onClick={() => openItemForm()}
                                className="btn-primary flex items-center space-x-2 text-sm py-1.5"
                            >
                                <Plus size={16} />
                                <span>Añadir Requisito</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                            {/* Modal/Form Overlay for Items */}
                            {showItemForm && (
                                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 flex items-center justify-center p-8 overflow-y-auto">
                                    <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-6 animate-in fade-in zoom-in-95 duration-200">
                                        <h3 className="text-lg font-bold mb-4 flex items-center">
                                            {editingItem ? <Edit size={20} className="mr-2 text-blue-500" /> : <Plus size={20} className="mr-2 text-green-500" />}
                                            {editingItem ? 'Editar Requisito' : 'Nuevo Requisito'}
                                        </h3>
                                        <form onSubmit={handleSaveItem} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Código</label>
                                                    <input
                                                        type="text" className="input mt-1"
                                                        value={itemFormData.code}
                                                        onChange={e => setItemFormData({ ...itemFormData, code: e.target.value })}
                                                        placeholder="Ej. REG-001" required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-semibold text-gray-500 uppercase">Módulo</label>
                                                    <select
                                                        className="input mt-1"
                                                        value={itemFormData.module}
                                                        onChange={e => setItemFormData({ ...itemFormData, module: e.target.value })}
                                                    >
                                                        <option value="General">General</option>
                                                        <option value="Legal">Legal</option>
                                                        <option value="Quality">Calidad</option>
                                                        <option value="Safety">Seguridad</option>
                                                        <option value="Efficacy">Eficacia</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-500 uppercase">Título (Español) *</label>
                                                <textarea
                                                    className="input mt-1 h-20"
                                                    value={itemFormData.title_es}
                                                    onChange={e => setItemFormData({ ...itemFormData, title_es: e.target.value })}
                                                    placeholder="Descripción del documento requerido..." required
                                                />
                                            </div>

                                            <div className="flex gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={itemFormData.required}
                                                        onChange={e => setItemFormData({ ...itemFormData, required: e.target.checked })}
                                                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                    />
                                                    <span className="text-sm font-medium text-gray-700">Obligatorio</span>
                                                </label>
                                                <label className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={itemFormData.critical}
                                                        onChange={e => setItemFormData({ ...itemFormData, critical: e.target.checked })}
                                                        className="rounded text-red-600 focus:ring-red-500 h-4 w-4"
                                                    />
                                                    <span className="text-sm font-medium text-red-700 flex items-center">
                                                        <AlertCircle size={14} className="mr-1" /> Crítico
                                                    </span>
                                                </label>
                                                <div className="flex-1 text-right">
                                                    <label className="text-xs font-semibold text-gray-400 mr-2">Orden:</label>
                                                    <input
                                                        type="number" className="w-16 text-sm border-gray-300 rounded"
                                                        value={itemFormData.sort_order}
                                                        onChange={e => setItemFormData({ ...itemFormData, sort_order: parseInt(e.target.value) })}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex gap-3 pt-4 border-t border-gray-100 mt-4">
                                                <button type="button" onClick={() => setShowItemForm(false)} className="btn-secondary w-full">
                                                    Cancelar
                                                </button>
                                                <button type="submit" className="btn-primary w-full">
                                                    Guardar
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* Item List */}
                            <div className="space-y-2">
                                {templateItems.map(item => (
                                    <div
                                        key={item.id}
                                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow group flex gap-4 items-start"
                                    >
                                        <div className="flex flex-col items-center justify-center pt-1 text-gray-400">
                                            <GripVertical size={20} className="cursor-grab hover:text-gray-600" />
                                            <span className="text-[10px] font-mono mt-1">{item.sort_order}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600 border border-gray-200">
                                                    {item.code}
                                                </span>
                                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                    {item.module}
                                                </span>
                                                {item.critical && (
                                                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-tighter flex items-center">
                                                        <AlertCircle size={10} className="mr-1" /> Crítico
                                                    </span>
                                                )}
                                                {!item.required && (
                                                    <span className="text-[10px] text-gray-400 font-medium italic">
                                                        (Opcional)
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-900 font-medium text-sm leading-snug">
                                                {item.title_i18n_json?.es}
                                            </p>
                                        </div>

                                        <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                            <button
                                                onClick={() => openItemForm(item)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {templateItems.length === 0 && !loadingItems && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-white rounded-lg border border-dashed border-gray-300">
                                        <ClipboardList size={48} className="mb-2 opacity-50" />
                                        <p>Esta plantilla está vacía.</p>
                                        <button onClick={() => openItemForm()} className="mt-4 text-sm text-blue-600 hover:underline">
                                            Añade el primer requisito
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <ChevronRight size={32} className="text-gray-300 ml-1" />
                        </div>
                        <p className="font-medium text-gray-500">Selecciona una plantilla</p>
                        <p className="text-sm mt-2 max-w-xs text-center text-gray-400">
                            Haz clic en una plantilla de la izquierda para ver y editar sus requisitos.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
