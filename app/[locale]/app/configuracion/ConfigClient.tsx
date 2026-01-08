'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Save, Bot, Key, AlertTriangle } from 'lucide-react';

interface Props {
    labId: string;
}

export default function ConfigClient({ labId }: Props) {
    const [openaiKey, setOpenaiKey] = useState('');
    const [geminiKey, setGeminiKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (labId) loadConfig();
    }, [labId]);

    const loadConfig = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from('labs')
            .select('openai_api_key, gemini_api_key')
            .eq('id', labId)
            .single();

        if (!error && data) {
            setOpenaiKey(data.openai_api_key || '');
            setGeminiKey(data.gemini_api_key || '');
        }
        setLoading(false);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        const supabase = createClient();

        const { error } = await supabase
            .from('labs')
            .update({
                openai_api_key: openaiKey,
                gemini_api_key: geminiKey
            })
            .eq('id', labId);

        if (error) {
            alert("Error al guardar configuración: " + error.message);
        } else {
            alert("Configuración de IA guardada correctamente.");
        }
        setSaving(false);
    };

    if (!labId) return <div className="text-gray-500">Seleccione un laboratorio para configurar.</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Inteligencia Artificial</h2>
                        <p className="text-sm text-gray-500">Configura los motores de IA para análisis de documentos.</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">

                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 flex gap-3 text-sm text-yellow-800">
                    <AlertTriangle className="flex-shrink-0" size={20} />
                    <p>
                        Estas claves se usarán para procesar y analizar automáticamente los documentos técnicos subidos a este laboratorio.
                        Asegúrate de tener créditos disponibles en las plataformas correspondientes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* OpenAI */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Key size={16} /> OpenAI API Key
                        </label>
                        <input
                            type="password"
                            className="input w-full font-mono text-sm"
                            placeholder="sk-..."
                            value={openaiKey}
                            onChange={(e) => setOpenaiKey(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">Modelo recomendado: GPT-4o</p>
                    </div>

                    {/* Gemini */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <Key size={16} /> Google Gemini API Key
                        </label>
                        <input
                            type="password"
                            className="input w-full font-mono text-sm"
                            placeholder="AIzb..."
                            value={geminiKey}
                            onChange={(e) => setGeminiKey(e.target.value)}
                        />
                        <p className="text-xs text-gray-400">Modelo recomendado: Gemini 1.5 Pro</p>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
}
