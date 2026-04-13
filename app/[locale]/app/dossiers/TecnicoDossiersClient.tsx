'use client';

import { useLocale } from 'next-intl';
import { FolderOpen, Calendar, ArrowRight, Package, Building2 } from 'lucide-react';
import Link from 'next/link';

interface Dossier {
    id: string;
    product_name: string;
    status: string;
    product_type: string;
    created_at: string;
    lab_name: string;
}

interface Props {
    dossiers: Dossier[];
    userId: string;
}

export default function TecnicoDossiersClient({ dossiers, userId }: Props) {
    const locale = useLocale();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'in_progress': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'ready': return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'submitted': return 'bg-green-50 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Borrador';
            case 'in_progress': return 'En Progreso';
            case 'ready': return 'Listo para Envío';
            case 'submitted': return 'Enviado';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Mis Dossiers Asignados</h1>
                <p className="text-gray-600 mt-1">Expedientes regulatorios asignados a tu gestión</p>
            </div>

            {dossiers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                    <FolderOpen size={48} className="mx-auto mb-4 opacity-30" />
                    <p>No tienes dossiers asignados aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dossiers.map(dossier => (
                        <Link key={dossier.id} href={`/${locale}/app/dossiers/${dossier.id}`} className="block">
                            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group hover:border-blue-300 relative overflow-hidden">
                                {/* Status Stripe */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${
                                    dossier.status === 'ready' ? 'bg-purple-500' :
                                    dossier.status === 'submitted' ? 'bg-green-500' :
                                    dossier.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                                }`} />

                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                        <FolderOpen size={24} />
                                    </div>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(dossier.status)} uppercase tracking-wide`}>
                                        {getStatusLabel(dossier.status)}
                                    </span>
                                </div>

                                <div className="pl-2">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-blue-700 transition-colors">
                                        {dossier.product_name}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        <Package size={12} />
                                        {dossier.product_type}
                                    </p>
                                    <p className="text-xs text-teal-600 font-medium mb-4 flex items-center gap-1">
                                        <Building2 size={12} />
                                        {dossier.lab_name}
                                    </p>

                                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-1">
                                            <Calendar size={12} />
                                            {new Date(dossier.created_at).toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-US')}
                                        </div>
                                        <div className="flex items-center text-blue-500 font-medium group-hover:translate-x-1 transition-transform">
                                            Ver detalles <ArrowRight size={12} className="ml-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
