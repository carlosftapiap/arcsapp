'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Clock, FileText, CheckCircle, AlertCircle, MessageSquare,
    Plus, Trash2, RefreshCw, Activity, ChevronDown, ChevronUp
} from 'lucide-react';

// Estructura que devuelve get_recent_activity RPC
interface ActivityEntry {
    source_id: string;
    type: string;
    desc_text: string;
    e_id: string;
    e_name: string;
    user_name: string;
    time_at: string;
    meta: {
        stage_code?: string;
        stage_title?: { es?: string; en?: string } | string;
        decision?: string;
        version_reviewed?: number;
        [key: string]: any;
    };
}

interface Props {
    dossierId: string;
}

const EVENT_LABELS: Record<string, string> = {
    document_uploaded: 'Documento subido',
    document_deleted:  'Documento eliminado',
    review_added:      'Revisión',
    lab_comment:       'Comentario',
    dossier_created:   'Dossier creado',
    dossier_status:    'Estado actualizado',
    ai_analysis:       'Análisis IA',
};

const EVENT_COLORS: Record<string, string> = {
    document_uploaded: 'bg-purple-50 border-purple-200 text-purple-700',
    document_deleted:  'bg-red-50 border-red-200 text-red-700',
    review_added:      'bg-green-50 border-green-200 text-green-700',
    lab_comment:       'bg-pink-50 border-pink-200 text-pink-700',
    dossier_created:   'bg-blue-50 border-blue-200 text-blue-700',
    dossier_status:    'bg-indigo-50 border-indigo-200 text-indigo-700',
    ai_analysis:       'bg-amber-50 border-amber-200 text-amber-700',
};

function EventIcon({ type, meta }: { type: string; meta: any }) {
    switch (type) {
        case 'document_uploaded': return <FileText size={13} />;
        case 'document_deleted':  return <Trash2 size={13} />;
        case 'review_added':
            return meta?.decision === 'approved'
                ? <CheckCircle size={13} />
                : <AlertCircle size={13} />;
        case 'lab_comment':    return <MessageSquare size={13} />;
        case 'dossier_created': return <Plus size={13} />;
        default:               return <Activity size={13} />;
    }
}

function StageLabel({ meta }: { meta: any }) {
    if (!meta?.stage_code) return null;
    const title = meta.stage_title;
    const titleText = typeof title === 'object' && title !== null
        ? (title.es || title.en || '')
        : (typeof title === 'string' ? title : '');

    return (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
            <span className="text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded font-mono">
                {meta.stage_code}
            </span>
            {titleText && (
                <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded truncate max-w-[200px]">
                    {titleText}
                </span>
            )}
        </div>
    );
}

export default function DossierActivityLog({ dossierId }: Props) {
    const [entries, setEntries] = useState<ActivityEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(true);

    const fetchLog = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/dossier-activity?dossierId=${dossierId}`);
            const data = await res.json();
            setEntries(data.entries || []);
        } catch (err) {
            console.error('Error loading dossier activity:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLog(); }, [dossierId]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
            >
                <div className="flex items-center gap-2">
                    <Clock size={16} className="text-blue-500" />
                    <h3 className="font-semibold text-sm text-gray-800">Historial de Actividad</h3>
                    <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{entries.length}</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); fetchLog(); }}
                        className="text-xs text-blue-500 hover:text-blue-700"
                        title="Actualizar"
                    >
                        <RefreshCw size={12} />
                    </button>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </div>

            {expanded && (
                <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                        <div className="p-6 text-center text-sm text-gray-400 animate-pulse">Cargando actividad...</div>
                    ) : entries.length === 0 ? (
                        <div className="p-6 text-center text-sm text-gray-400">Sin actividad registrada.</div>
                    ) : (
                        <ol className="relative border-l border-gray-200 ml-4 my-3 mr-3">
                            {entries.map((entry, idx) => {
                                const colorClass = EVENT_COLORS[entry.type] || 'bg-gray-50 border-gray-200 text-gray-500';
                                return (
                                    <li key={`${entry.source_id}-${idx}`} className="mb-5 ml-5">
                                        <span className={`absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm ${colorClass}`}>
                                            <EventIcon type={entry.type} meta={entry.meta} />
                                        </span>

                                        {/* Tipo de evento */}
                                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border mb-1 ${colorClass}`}>
                                            {EVENT_LABELS[entry.type] || entry.type}
                                        </span>

                                        {/* Descripción principal — viene del RPC ya formateada */}
                                        <p className="text-xs text-gray-800 font-medium leading-snug">
                                            {entry.desc_text}
                                        </p>

                                        {/* Stage badge */}
                                        <StageLabel meta={entry.meta} />

                                        {/* Usuario */}
                                        {entry.user_name && (
                                            <p className="text-[11px] text-gray-400 mt-0.5">• {entry.user_name}</p>
                                        )}

                                        {/* Fecha */}
                                        <time className="text-[10px] text-gray-400 mt-0.5 block">
                                            {format(new Date(entry.time_at), "d MMM yyyy, HH:mm", { locale: es })}
                                            {' · '}
                                            {formatDistanceToNow(new Date(entry.time_at), { addSuffix: true, locale: es })}
                                        </time>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            )}
        </div>
    );
}
