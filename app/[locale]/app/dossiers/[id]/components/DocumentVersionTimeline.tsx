'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { History, Download, CheckCircle2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

interface DocVersion {
    id: string;
    file_path: string;
    version: number;
    status: string;
    uploaded_at: string;
    deleted_at?: string | null;
    deleted_by?: string | null;
    file_size?: number | null;
    profiles?: { full_name: string; email: string } | null;
}

interface Props {
    itemCode: string;
    documents: DocVersion[];
}

function formatBytes(bytes?: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentVersionTimeline({ itemCode, documents }: Props) {
    const [open, setOpen] = useState(false);
    const [downloading, setDownloading] = useState<string | null>(null);

    if (documents.length === 0) return null;

    const handleDownload = async (filePath: string) => {
        setDownloading(filePath);
        const supabase = createClient();
        try {
            const { data, error } = await supabase.storage
                .from('dossier-documents')
                .download(filePath);
            if (error) throw error;
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filePath.split('/').pop() || 'documento');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err: any) {
            alert('Error al descargar: ' + err.message);
        } finally {
            setDownloading(null);
        }
    };

    const activeCount = documents.filter(d => d.status !== 'deleted').length;
    const deletedCount = documents.filter(d => d.status === 'deleted').length;

    return (
        <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            {/* Header colapsable */}
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-left"
            >
                <span className="flex items-center gap-2 text-xs font-medium text-gray-600">
                    <History size={13} />
                    Historial de versiones
                    <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">
                        {activeCount} activo{activeCount !== 1 ? 's' : ''}
                    </span>
                    {deletedCount > 0 && (
                        <span className="bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">
                            {deletedCount} eliminado{deletedCount !== 1 ? 's' : ''}
                        </span>
                    )}
                </span>
                {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
            </button>

            {/* Timeline */}
            {open && (
                <div className="divide-y divide-gray-100">
                    {documents.map((doc, i) => {
                        const isDeleted = doc.status === 'deleted';
                        const fileName = doc.file_path.split('/').pop() || doc.file_path;
                        const isFirst = i === 0;

                        return (
                            <div
                                key={doc.id}
                                className={`flex items-start gap-3 px-3 py-2.5 ${isDeleted ? 'bg-gray-50' : 'bg-white'}`}
                            >
                                {/* Ícono de estado */}
                                <div className="mt-0.5 shrink-0">
                                    {isDeleted ? (
                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                            <Trash2 size={11} className="text-gray-400" />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                                            <CheckCircle2 size={11} className="text-green-600" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[11px] font-mono font-bold text-gray-500">
                                            v{doc.version}
                                        </span>
                                        {isFirst && !isDeleted && (
                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 rounded">actual</span>
                                        )}
                                        {isDeleted && (
                                            <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 rounded">eliminado</span>
                                        )}
                                    </div>

                                    <p className={`text-xs mt-0.5 truncate max-w-xs ${isDeleted ? 'line-through text-gray-400' : 'text-gray-700'}`}
                                        title={fileName}>
                                        {fileName}
                                    </p>

                                    <div className="flex flex-wrap gap-x-3 mt-1 text-[10px] text-gray-400">
                                        <span>
                                            Subido: {new Date(doc.uploaded_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {doc.profiles?.full_name && (
                                            <span>por {doc.profiles.full_name}</span>
                                        )}
                                        {doc.file_size && (
                                            <span>{formatBytes(doc.file_size)}</span>
                                        )}
                                        {isDeleted && doc.deleted_at && (
                                            <span className="text-red-400">
                                                Eliminado: {new Date(doc.deleted_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Descarga */}
                                <button
                                    onClick={() => handleDownload(doc.file_path)}
                                    disabled={downloading === doc.file_path}
                                    className={`shrink-0 p-1.5 rounded hover:bg-gray-100 ${isDeleted ? 'text-gray-400' : 'text-blue-500'}`}
                                    title={isDeleted ? 'Descargar versión eliminada' : 'Descargar'}
                                >
                                    <Download size={13} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
