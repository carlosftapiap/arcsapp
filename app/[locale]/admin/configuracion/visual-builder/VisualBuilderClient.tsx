'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Layout, Save, Plus, Trash2, GripVertical, Settings,
    Type, FileText, Smartphone, Activity, Box, Search,
    ArrowLeft, Eye, CheckSquare, AlertTriangle, X
} from 'lucide-react';
import Link from 'next/link';

// Types
interface ChecklistTemplate {
    id: string;
    product_type: string;
    name: string;
    version: number;
    active: boolean;
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
    ai_prompt?: string;
}

export default function VisualBuilderClient() {
    // State
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeModule, setActiveModule] = useState<string>('All');
    const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);

    // Initial Fetch
    useEffect(() => {
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (selectedTemplate) {
            fetchItems(selectedTemplate.id);
        } else {
            setItems([]);
        }
    }, [selectedTemplate]);

    const fetchTemplates = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('checklist_templates').select('*').order('name');
        if (data) setTemplates(data);
    };

    const fetchItems = async (templateId: string) => {
        setLoading(true);
        const supabase = createClient();
        const { data } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('template_id', templateId)
            .order('sort_order');
        if (data) setItems(data);
        setLoading(false);
    };

    // Derived State
    const modules = Array.from(new Set(items.map(i => i.module)));
    const filteredItems = activeModule === 'All'
        ? items
        : items.filter(i => i.module === activeModule);

    // Handlers
    const handleNewTemplate = async () => {
        const name = prompt("Nombre de la nueva plantilla:");
        if (!name) return;

        const supabase = createClient();
        const { data, error } = await supabase.from('checklist_templates').insert([{
            name,
            product_type: 'medicine_general',
            version: 1,
            active: false
        }]).select().single();

        if (data) {
            setTemplates([...templates, data]);
            setSelectedTemplate(data);
        }
    };

    const handleAddItem = async () => {
        if (!selectedTemplate) return;

        const nextOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 10 : 10;
        const newItemPayload = {
            template_id: selectedTemplate.id,
            code: `NEW-${items.length + 1}`,
            module: activeModule === 'All' ? 'General' : activeModule,
            title_i18n_json: { es: 'Nuevo Requisito', en: 'New Requirement' },
            required: true,
            critical: false,
            sort_order: nextOrder
        };

        const supabase = createClient();
        const { data, error } = await supabase.from('checklist_items').insert([newItemPayload]).select().single();

        if (data) {
            setItems([...items, data]);
            setSelectedItem(data);
        }
    };

    const handleUpdateItem = async (id: string, updates: Partial<ChecklistItem>) => {
        // Optimistic update
        setItems(items.map(i => i.id === id ? { ...i, ...updates } : i));

        // Debounce save in real app, distinct save for now
        const supabase = createClient();
        await supabase.from('checklist_items').update(updates).eq('id', id);
    };

    // Icons helper
    const getModuleIcon = (mod: string) => {
        switch (mod.toLowerCase()) {
            case 'legal': return <FileText size={16} />;
            case 'administrativo': return <FileText size={16} />;
            case 'technical': return <Settings size={16} />;
            case 'técnico': return <Settings size={16} />;
            case 'quality': return <CheckSquare size={16} />;
            case 'calidad': return <CheckSquare size={16} />;
            case 'efficacy': return <Activity size={16} />;
            case 'estabilidad': return <Activity size={16} />;
            default: return <Box size={16} />;
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-gray-50 -m-6 p-6">

            {/* 1. Sidebar: Templates Navigation */}
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                        <Layout className="text-blue-600" size={20} />
                        <span>Visual Builder</span>
                    </div>
                    <button onClick={handleNewTemplate} className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
                        <Plus size={16} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="p-2 space-y-1">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTemplate(t)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group ${selectedTemplate?.id === t.id
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="truncate">{t.name}</span>
                                {selectedTemplate?.id === t.id && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <Link href="/es/admin/configuracion/plantillas" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft size={14} /> Volver a lista clásica
                    </Link>
                </div>
            </div>

            {/* 2. Main Canvas */}
            <div className="flex-1 flex flex-col min-w-0 bg-gray-50/50">
                {selectedTemplate ? (
                    <>
                        {/* Toolbar */}
                        <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-10">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">{selectedTemplate.name}</h2>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                        {selectedTemplate.product_type}
                                    </span>
                                    <span>v{selectedTemplate.version}</span>
                                    <span className={`px-2 py-0.5 rounded-full ${selectedTemplate.active ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`}>
                                        {selectedTemplate.active ? 'Activo' : 'Borrador'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Module Filter Tabs */}
                                <div className="flex bg-gray-100 p-1 rounded-lg mr-4">
                                    <button
                                        onClick={() => setActiveModule('All')}
                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeModule === 'All' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        Todos
                                    </button>
                                    {modules.map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setActiveModule(m)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${activeModule === m ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {getModuleIcon(m)} {m}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={handleAddItem}
                                    className="btn-primary flex items-center gap-2"
                                >
                                    <Plus size={16} /> Añadir Item
                                </button>
                            </div>
                        </div>

                        {/* Visual Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {filteredItems.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={() => setSelectedItem(item)}
                                            className={`
                                                relative p-4 rounded-xl border-2 cursor-pointer transition-all group bg-white
                                                ${selectedItem?.id === item.id
                                                    ? 'border-blue-500 shadow-md ring-2 ring-blue-100'
                                                    : 'border-transparent shadow-sm hover:border-gray-200 hover:shadow-md'
                                                }
                                            `}
                                        >
                                            {/* Header Card */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                        {item.code}
                                                    </span>
                                                    {item.critical && (
                                                        <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-0.5">
                                                            <AlertTriangle size={10} /> CRÍTICO
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <GripVertical size={16} className="text-gray-300" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <h3 className="font-semibold text-gray-800 text-sm mb-1 leading-snug">
                                                {item.title_i18n_json.es}
                                            </h3>
                                            <p className="text-xs text-gray-400 line-clamp-2 min-h-[2.5em]">
                                                {item.ai_prompt || "Sin prompt configurado..."}
                                            </p>

                                            {/* Footer */}
                                            <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
                                                <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-wider">
                                                    {item.module}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {item.required && <CheckSquare size={14} className="text-gray-300" />}
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Button Card */}
                                    <button
                                        onClick={handleAddItem}
                                        className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[160px]"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2 group-hover:bg-white">
                                            <Plus size={20} />
                                        </div>
                                        <span className="text-sm font-medium">Añadir otro requisito</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Layout size={64} className="text-gray-200 mb-4" />
                        <p className="text-lg font-medium text-gray-500">Visual Template Builder</p>
                        <p className="text-sm">Selecciona una plantilla para empezar a editar visualmente</p>
                    </div>
                )}
            </div>

            {/* 3. Right Sidebar: Inspector */}
            {selectedItem && (
                <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-xl absolute right-0 top-0 bottom-0 z-20 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h3 className="font-bold text-gray-700 flex items-center gap-2">
                            <Settings size={16} /> Propiedades
                        </h3>
                        <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-700">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Código Item</label>
                            <input
                                type="text"
                                className="input w-full font-mono bg-gray-50"
                                value={selectedItem.code}
                                onChange={(e) => handleUpdateItem(selectedItem.id, { code: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Módulo</label>
                            <select
                                className="input w-full"
                                value={selectedItem.module}
                                onChange={(e) => handleUpdateItem(selectedItem.id, { module: e.target.value })}
                            >
                                <option value="General">General</option>
                                <option value="Legal">Legal / Administrativo</option>
                                <option value="Calidad">Calidad (Quality)</option>
                                <option value="Estabilidad">Estabilidad</option>
                                <option value="Etiquetado">Etiquetado</option>
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Título (ES)</label>
                            <textarea
                                className="input w-full min-h-[80px]"
                                value={selectedItem.title_i18n_json.es}
                                onChange={(e) => handleUpdateItem(selectedItem.id, {
                                    title_i18n_json: { ...selectedItem.title_i18n_json, es: e.target.value }
                                })}
                            />
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100">
                            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-700">Obligatorio</span>
                                <input
                                    type="checkbox"
                                    className="toggle"
                                    checked={selectedItem.required}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, { required: e.target.checked })}
                                />
                            </label>
                            <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <AlertTriangle size={14} className="text-red-500" /> Crítico
                                </span>
                                <input
                                    type="checkbox"
                                    className="toggle"
                                    checked={selectedItem.critical}
                                    onChange={(e) => handleUpdateItem(selectedItem.id, { critical: e.target.checked })}
                                />
                            </label>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-gray-100">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Prompt IA</label>
                            <textarea
                                className="input w-full min-h-[120px] text-xs font-mono bg-yellow-50/50 border-yellow-200 focus:border-yellow-400 focus:ring-yellow-200"
                                value={selectedItem.ai_prompt || ''}
                                onChange={(e) => handleUpdateItem(selectedItem.id, { ai_prompt: e.target.value })}
                                placeholder="Prompt para el análisis del Agente..."
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                        <button className="w-full btn-secondary text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200">
                            <Trash2 size={16} className="mr-2" /> Eliminar Item
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple icons for X
import { X as XIcon } from 'lucide-react';
