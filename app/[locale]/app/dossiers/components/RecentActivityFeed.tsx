'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, FileText, CheckCircle, AlertCircle, MessageSquare, Plus, Activity, Trash2, RefreshCw } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import Link from 'next/link';

interface ActivityItem {
    source_id: string;
    type: 'dossier_created' | 'dossier_status' | 'document_uploaded' | 'document_deleted' | 'review_added' | 'lab_comment';
    desc_text: string;
    e_id: string; // Dossier ID
    e_name: string; // Product Name
    u_id: string;
    user_name: string;
    time_at: string;
    meta: {
        stage_code?: string;
        stage_title?: { es: string; en: string };
        file_path?: string;
        status?: string;
        decision?: 'approved' | 'observed' | 'rejected';
        version_reviewed?: number;
        product_type?: string;
    } | any;
}

export default function RecentActivityFeed({ labId }: { labId?: string }) {
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const t = useTranslations();
    const locale = useLocale();

    // Map locale string to date-fns locale object
    const dateLocale = locale === 'es' ? es : enUS;

    useEffect(() => {
        // Now using RPC that handles permissions/filtering
        fetchActivity();
    }, [labId]);

    const fetchActivity = async () => {
        setLoading(true);
        const supabase = createClient();

        try {
            const { data, error } = await supabase.rpc('get_recent_activity', {
                p_limit: 50,
                p_offset: 0,
                p_lab_id: labId || null
            });

            if (error) {
                console.error('Error fetching activity:', error.message || error);
            } else {
                setActivities(data || []);
            }
        } catch (err: any) {
            console.error('Unexpected error fetching activity:', err.message || err);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type: string, meta: any) => {
        switch (type) {
            case 'dossier_created': return <Plus size={16} className="text-green-600" />;
            case 'dossier_status': return <ActivitySize16 className="text-blue-600" />;
            case 'document_uploaded': return <FileText size={16} className="text-purple-600" />;
            case 'document_deleted': return <Trash2 size={16} className="text-red-600" />;
            case 'review_added':
                return meta?.decision === 'approved'
                    ? <CheckCircle size={16} className="text-green-600" />
                    : <AlertCircle size={16} className="text-amber-600" />;
            case 'lab_comment': return <MessageSquare size={16} className="text-pink-600" />;
            default: return <Clock size={16} className="text-gray-500" />;
        }
    };

    // Helper wrapper for Activity icon to avoid conflict with imported Activity component from 'lucide-react'
    // But since we sort of imported Activity as ActivityIcon alias in other files, here we imported it as 'Activity'. 
    // To be safe and consistent with the icon set:
    const ActivitySize16 = ({ className }: { className?: string }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
    );

    const getStageLabel = (meta: any) => {
        if (!meta?.stage_code) return null;
        // Handle multilingual title or string fallback
        const titleObj = meta.stage_title;
        const title = typeof titleObj === 'object' && titleObj !== null
            ? (titleObj[locale as keyof typeof titleObj] || titleObj.es || '')
            : (typeof titleObj === 'string' ? titleObj : '');

        return (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200 ml-2 mt-1 sm:mt-0">
                <span className="font-bold">{meta.stage_code}</span>
                {title && <span className="truncate max-w-[120px] hidden sm:inline border-l border-gray-300 pl-1 ml-1">{title}</span>}
            </span>
        );
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-500 animate-pulse">Cargando actividad...</div>;
    }

    if (activities.length === 0) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
                <Clock className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No hay actividad reciente.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <HistoryIcon /> Actividad Reciente
                </h3>
                <button onClick={fetchActivity} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <RefreshCw size={12} /> Actualizar
                </button>
            </div>
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {activities.map((item, idx) => (
                    <div key={`${item.source_id}-${idx}`} className="p-4 hover:bg-gray-50 transition-colors group">
                        <div className="flex gap-3">
                            <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border shadow-sm ${item.type === 'document_deleted' ? 'bg-red-50 border-red-100' :
                                item.type === 'review_added' && item.meta?.decision === 'approved' ? 'bg-green-50 border-green-100' :
                                    item.type === 'review_added' && item.meta?.decision !== 'approved' ? 'bg-amber-50 border-amber-100' :
                                        'bg-gray-50 border-gray-200'
                                }`}>
                                {getActivityIcon(item.type, item.meta)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <p className="text-sm font-medium text-gray-900 truncate pr-2">
                                        <Link href={`/${locale}/app/dossiers/${item.e_id}`} className="hover:text-blue-600 hover:underline transition-all">
                                            {item.e_name}
                                        </Link>
                                    </p>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">
                                        {item.time_at ? formatDistanceToNow(new Date(item.time_at), { addSuffix: true, locale: dateLocale }) : ''}
                                    </span>
                                </div>

                                <div className="text-xs text-gray-600 mt-1">
                                    <div className="flex items-center flex-wrap gap-y-1">
                                        <span className={item.type === 'document_deleted' ? 'line-through text-gray-400' : ''}>
                                            {item.desc_text}
                                        </span>
                                        {getStageLabel(item.meta)}
                                    </div>

                                    {item.user_name && <p className="text-gray-400 mt-0.5 text-[11px]">• por {item.user_name}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HistoryIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l4 2" />
        </svg>
    );
}
