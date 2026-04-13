'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Activity, FileText, CheckCircle, AlertCircle, MessageSquare,
    Plus, Trash2, LogIn, LogOut, Search, Filter, Download, User,
    Building2, FolderOpen, Bot, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

interface LogEntry {
    id: string;
    event_type: string;
    payload_json: any;
    created_at: string;
    actor_user_id: string;
    lab_id: string | null;
    dossier_id: string | null;
    lab_name: string | null;
    dossier_name: string | null;
}

const EVENT_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
    user_login:       { label: 'Inicio de Sesión',    icon: LogIn,         color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    user_logout:      { label: 'Cierre de Sesión',    icon: LogOut,        color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
    document_uploaded:{ label: 'Doc. Subido',         icon: FileText,      color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
    document_deleted: { label: 'Doc. Eliminado',      icon: Trash2,        color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
    review_added:     { label: 'Revisión',            icon: CheckCircle,   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
    lab_comment:      { label: 'Comentario',          icon: MessageSquare, color: 'text-pink-700',   bg: 'bg-pink-50 border-pink-200' },
    dossier_created:  { label: 'Dossier Creado',      icon: Plus,          color: 'text-teal-700',   bg: 'bg-teal-50 border-teal-200' },
    dossier_status:   { label: 'Estado Dossier',      icon: Activity,      color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
    ai_analysis:      { label: 'Análisis IA',         icon: Bot,           color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
};

const ALL_TYPES = Object.keys(EVENT_CONFIG);

function getDesc(log: LogEntry): string {
    const p = log.payload_json || {};
    const user = p.user_name || p.user_email || 'Usuario desconocido';
    switch (log.event_type) {
        case 'user_login':    return `${user} inició sesión`;
        case 'user_logout':   return `${user} cerró sesión`;
        case 'document_uploaded': return `${user} subió "${p.file_name || 'documento'}" ${p.stage_code ? `(${p.stage_code})` : ''}`;
        case 'document_deleted':  return `${user} eliminó "${p.file_name || 'documento'}" ${p.stage_code ? `(${p.stage_code})` : ''}`;
        case 'review_added':  return `${user} revisó: "${p.decision || ''}" ${p.stage_code ? `(${p.stage_code})` : ''}`;
        case 'lab_comment':   return `${user} comentó en ${p.stage_code ? `(${p.stage_code})` : ''}`;
        case 'dossier_created': return `${user} creó el dossier`;
        case 'dossier_status':  return `Estado → "${p.status || ''}" por ${user}`;
        case 'ai_analysis':   return `${user} ejecutó análisis IA ${p.stage_code ? `(${p.stage_code})` : ''}`;
        default: return p.desc_text || log.event_type;
    }
}

export default function ActivityLogClient({ logs }: { logs: LogEntry[] }) {
    const locale = useLocale();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const filtered = useMemo(() => {
        return logs.filter(log => {
            if (typeFilter !== 'all' && log.event_type !== typeFilter) return false;
            if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) return false;
            if (dateTo && new Date(log.created_at) > new Date(dateTo + 'T23:59:59')) return false;
            if (search) {
                const q = search.toLowerCase();
                const p = log.payload_json || {};
                return (
                    (p.user_name || '').toLowerCase().includes(q) ||
                    (p.user_email || '').toLowerCase().includes(q) ||
                    (log.dossier_name || '').toLowerCase().includes(q) ||
                    (log.lab_name || '').toLowerCase().includes(q) ||
                    getDesc(log).toLowerCase().includes(q)
                );
            }
            return true;
        });
    }, [logs, typeFilter, search, dateFrom, dateTo]);

    const downloadCSV = () => {
        const rows = [
            ['Fecha', 'Tipo', 'Usuario', 'Email', 'Laboratorio', 'Dossier', 'Descripción', 'IP'].join(','),
            ...filtered.map(log => {
                const p = log.payload_json || {};
                return [
                    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
                    EVENT_CONFIG[log.event_type]?.label || log.event_type,
                    p.user_name || '',
                    p.user_email || '',
                    log.lab_name || '',
                    log.dossier_name || '',
                    `"${getDesc(log).replace(/"/g, '""')}"`,
                    p.ip_address || '',
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `arcsapp-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Conteo de eventos de sesión
    const loginCount = logs.filter(l => l.event_type === 'user_login').length;
    const uploadCount = logs.filter(l => l.event_type === 'document_uploaded').length;
    const deleteCount = logs.filter(l => l.event_type === 'document_deleted').length;
    const reviewCount = logs.filter(l => l.event_type === 'review_added').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Activity className="text-indigo-600" size={32} />
                        Log de Actividad Global
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">Historial completo de acciones en el sistema — Solo visible para administradores</p>
                </div>
                <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Download size={16} />
                    Exportar CSV
                </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Inicios de sesión', value: loginCount, icon: LogIn, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Docs subidos', value: uploadCount, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { label: 'Docs eliminados', value: deleteCount, icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Revisiones', value: reviewCount, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
                ].map(stat => (
                    <div key={stat.label} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
                        <div className={`${stat.color} mb-1`}><stat.icon size={20} /></div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por usuario, dossier, laboratorio..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                    <option value="all">Todos los tipos</option>
                    {ALL_TYPES.map(t => (
                        <option key={t} value={t}>{EVENT_CONFIG[t]?.label || t}</option>
                    ))}
                </select>
                <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    title="Desde"
                />
                <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    title="Hasta"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                        {filtered.length} registros
                        {filtered.length !== logs.length && ` (de ${logs.length} totales)`}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">Fecha / Hora</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Tipo</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Lab / Dossier</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">IP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                                        No hay registros que coincidan con los filtros.
                                    </td>
                                </tr>
                            ) : filtered.map(log => {
                                const cfg = EVENT_CONFIG[log.event_type] || { label: log.event_type, icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' };
                                const p = log.payload_json || {};
                                return (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                            <div className="font-medium text-gray-700">
                                                {format(new Date(log.created_at), 'dd/MM/yyyy', { locale: es })}
                                            </div>
                                            <div>{format(new Date(log.created_at), 'HH:mm:ss')}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
                                                <cfg.icon size={11} />
                                                {cfg.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                                                    <User size={13} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-800 text-xs">{p.user_name || '—'}</div>
                                                    <div className="text-gray-400 text-[11px]">{p.user_email || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-700 max-w-xs">
                                            {getDesc(log)}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            {log.lab_name && (
                                                <div className="flex items-center gap-1 text-gray-500 mb-0.5">
                                                    <Building2 size={11} />
                                                    <span className="truncate max-w-[120px]">{log.lab_name}</span>
                                                </div>
                                            )}
                                            {log.dossier_name && log.dossier_id && (
                                                <Link
                                                    href={`/${locale}/app/dossiers/${log.dossier_id}`}
                                                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                                                >
                                                    <FolderOpen size={11} />
                                                    <span className="truncate max-w-[120px]">{log.dossier_name}</span>
                                                </Link>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[11px] text-gray-400 font-mono">
                                            {p.ip_address || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
