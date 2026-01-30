'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { FolderOpen, Plus, Calendar, ArrowRight, Package, Building2, ClipboardList, AlertCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RecentActivityFeed from './components/RecentActivityFeed';

interface Product {
    id: string;
    nombre_comercial: string;
    product_type: string;
    principio_activo?: string;
}

interface Dossier {
    id: string;
    product_name: string;
    status: string;
    product_type: string;
    created_at: string;
    product_id?: string;
}

interface Lab {
    id: string;
    name: string;
}

interface LabDashboard {
    id: string;
    name: string;
    dossier_count: number;
    pending_review: number;
}

interface Props {
    initialDossiers: Dossier[];
    initialProducts: Product[]; // Renombrado para coincidir con page.tsx
    availableLabs: Lab[];
    initialLabId: string;
    userRole?: string;
    labsDashboard?: LabDashboard[];
}

export default function DossiersClient({ initialDossiers, initialProducts, availableLabs, initialLabId, userRole = 'viewer', labsDashboard = [] }: Props) {
    const t = useTranslations();
    const router = useRouter();
    const locale = useLocale();

    console.log("🏭 Laboratorios Disponibles (Debug):", availableLabs);

    // Estado para el laboratorio seleccionado
    const [currentLabId, setCurrentLabId] = useState(initialLabId);

    // Estado de datos (inicializado con props)
    const [dossiers, setDossiers] = useState<Dossier[]>(initialDossiers);
    const [products, setProducts] = useState<Product[]>(initialProducts || []);

    // UI States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showActivity, setShowActivity] = useState(true); // Toggle para mostrar/ocultar actividad

    // Flag to ignore initial render
    const [isFirstRender, setIsFirstRender] = useState(true);

    // Cargar datos cuando cambia el laboratorio
    useEffect(() => {
        if (isFirstRender) {
            setIsFirstRender(false);
            return;
        }
        loadLabData(currentLabId);
    }, [currentLabId]);

    const loadLabData = async (labId: string) => {
        if (!labId) {
            console.warn("loadLabData called without labId");
            return;
        }

        setRefreshing(true);
        // setDossiers([]); // Comentado para evitar parpadeo agresivo
        const supabase = createClient();

        console.log("🔄 Recargando datos para Lab ID:", labId);

        try {
            // 1. Cargar Dossiers
            const { data: newDossiers, error: dossiersError } = await supabase
                .from('dossiers')
                .select('*')
                .eq('lab_id', labId)
                .order('created_at', { ascending: false });

            if (dossiersError) throw dossiersError;

            // 2. Cargar Productos
            const { data: newProducts, error: productsError } = await supabase
                .from('products')
                .select('id, nombre_comercial, product_type, principio_activo')
                .eq('lab_id', labId)
                .order('nombre_comercial');

            if (productsError) throw productsError;

            setDossiers(newDossiers || []);
            setProducts(newProducts || []);

            console.log(`✅ Datos actualizados: ${newDossiers?.length} dossiers, ${newProducts?.length} productos.`);

        } catch (error) {
            console.error("Error cargando datos:", error);
            alert("Error al cargar datos del laboratorio.");
        } finally {
            setRefreshing(false);
        }
    };

    const handleCreateDossier = async () => {
        if (!selectedProductId) return;
        setLoading(true);
        const supabase = createClient();

        try {
            // 1. Obtener detalles del producto
            const product = products.find(p => p.id === selectedProductId);
            if (!product) throw new Error("Producto no encontrado");

            // 2. Buscar plantilla activa
            const { data: template, error: templateError } = await supabase
                .from('checklist_templates')
                .select('id, version')
                .eq('product_type', product.product_type)
                .eq('active', true)
                .order('version', { ascending: false })
                .limit(1)
                .single();

            if (templateError || !template) {
                throw new Error(`No existe una plantilla activa para el tipo: ${product.product_type}`);
            }

            // 3. Crear el Dossier
            const { data: stringDossier, error: dossierError } = await supabase
                .from('dossiers')
                .insert([{
                    lab_id: currentLabId,
                    product_id: product.id,
                    product_name: product.nombre_comercial,
                    product_type: product.product_type,
                    status: 'draft',
                    origin: 'imported'
                }])
                .select()
                .single();

            if (dossierError) throw dossierError;

            // 4. Copiar Items de la plantilla
            const { data: templateItems } = await supabase
                .from('checklist_items')
                .select('id, code, sort_order')
                .eq('template_id', template.id);

            if (templateItems && templateItems.length > 0) {
                const dossierItemsPayload = templateItems.map(item => ({
                    dossier_id: stringDossier.id,
                    checklist_item_id: item.id,
                    status: 'pending'
                }));

                await supabase.from('dossier_items').insert(dossierItemsPayload);
            }

            // Éxito
            setShowCreateModal(false);
            setDossiers([stringDossier, ...dossiers]);
            setSelectedProductId(''); // Reset selection
            router.push(`/${locale}/app/dossiers/${stringDossier.id}`);

        } catch (error: any) {
            console.error(error);
            alert('Error al crear dossier: ' + (error.message || error.details));
        } finally {
            setLoading(false);
        }
    };

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

    const handleDeleteDossier = async (e: React.MouseEvent, dossierId: string, productName: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (!confirm(`¿Estás seguro de eliminar el dossier "${productName}"?\n\nEsta acción eliminará todos los documentos y revisiones asociadas.`)) {
            return;
        }

        try {
            const supabase = createClient();

            // Eliminar dossier (los items se eliminan en cascada por FK)
            const { error } = await supabase
                .from('dossiers')
                .delete()
                .eq('id', dossierId);

            if (error) throw error;

            // Actualizar lista local y recargar datos del laboratorio
            setDossiers(dossiers.filter(d => d.id !== dossierId));

            // Recargar página para actualizar contadores del dashboard
            router.refresh();

        } catch (error: any) {
            console.error('Error al eliminar:', error);
            alert('Error al eliminar el dossier: ' + error.message);
        }
    };

    const canDelete = userRole === 'super_admin';
    const isReviewerOrAdmin = userRole === 'reviewer' || userRole === 'super_admin' || userRole === 'lab_admin';

    return (
        <div className="space-y-6">
            {/* Header con Selector de Laboratorio */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('dossiers.title')}</h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona tus expedientes y el progreso del registro sanitario
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Lab Selector */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-gray-500" />
                        </div>
                        <select
                            value={currentLabId}
                            onChange={(e) => setCurrentLabId(e.target.value)}
                            className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500 min-w-[200px] shadow-sm appearance-none"
                            disabled={loading || refreshing}
                        >
                            {availableLabs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Solo mostrar botón crear si NO es reviewer puro */}
                    {userRole !== 'reviewer' && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn-primary flex items-center space-x-2 whitespace-nowrap"
                            disabled={refreshing}
                        >
                            <Plus size={20} />
                            <span>Nuevo Dossier</span>
                        </button>
                    )}
                </div>
            </div>

            {refreshing && (
                <div className="w-full h-1 bg-gray-100 overflow-hidden rounded-full mb-4">
                    <div className="h-full bg-blue-500 animate-progress origin-left"></div>
                </div>
            )}

            {/* Layout principal: Grid + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Columna Principal (Dossiers y Dashboard) */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Dashboard para Revisores: Resumen de Labs con Dossiers */}
                    {(userRole === 'reviewer' || userRole === 'super_admin') && labsDashboard && labsDashboard.length > 0 && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <ClipboardList className="text-indigo-600" size={20} />
                                <h2 className="text-lg font-bold text-indigo-900">Panel de Revisión por Laboratorio</h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {labsDashboard.map(lab => {
                                    // Calcular contadores dinámicamente para el lab actual
                                    const isCurrentLab = lab.id === currentLabId;
                                    const dossierCount = isCurrentLab ? dossiers.length : lab.dossier_count;
                                    const pendingCount = isCurrentLab
                                        ? dossiers.filter(d => d.status === 'draft' || d.status === 'in_progress').length
                                        : lab.pending_review;

                                    return (
                                        <button
                                            key={lab.id}
                                            onClick={() => setCurrentLabId(lab.id)}
                                            className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${currentLabId === lab.id
                                                ? 'bg-white border-indigo-500 shadow-md'
                                                : 'bg-white/70 border-transparent hover:border-indigo-300'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-semibold truncate ${currentLabId === lab.id ? 'text-indigo-700' : 'text-gray-800'}`}>
                                                        {lab.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {dossierCount} {dossierCount === 1 ? 'dossier' : 'dossiers'}
                                                    </p>
                                                </div>
                                                {pendingCount > 0 && (
                                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                                                        <AlertCircle size={12} />
                                                        {pendingCount}
                                                    </span>
                                                )}
                                            </div>
                                            {pendingCount > 0 && (
                                                <p className="text-[10px] text-amber-600 mt-2">
                                                    {pendingCount} pendiente{pendingCount > 1 ? 's' : ''} de revisión
                                                </p>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Grid de Dossiers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dossiers.map(dossier => (
                            <Link key={dossier.id} href={`/${locale}/app/dossiers/${dossier.id}`} className="block">
                                <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group hover:border-blue-300 relative overflow-hidden">
                                    {/* Status Stripe */}
                                    <div className={`absolute top-0 left-0 w-1 h-full ${dossier.status === 'ready' ? 'bg-purple-500' :
                                        dossier.status === 'submitted' ? 'bg-green-500' :
                                            dossier.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`} />

                                    <div className="flex justify-between items-start mb-3 pl-2">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                            <FolderOpen size={24} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusColor(dossier.status)} uppercase tracking-wide`}>
                                                {getStatusLabel(dossier.status)}
                                            </span>
                                            {canDelete && (
                                                <button
                                                    onClick={(e) => handleDeleteDossier(e, dossier.id, dossier.product_name)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Eliminar dossier"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pl-2">
                                        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate group-hover:text-blue-700 transition-colors">
                                            {dossier.product_name}
                                        </h3>
                                        <p className="text-xs text-gray-500 mb-4 flex items-center">
                                            <Package size={12} className="mr-1" />
                                            {t(`productTypes.${dossier.product_type}`) || dossier.product_type}
                                        </p>

                                        <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-100">
                                            <div className="flex items-center">
                                                <Calendar size={12} className="mr-1" />
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

                        {/* Empty State Action Card */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-gray-400 hover:text-blue-600 gap-3 min-h-[180px]"
                        >
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-white group-hover:shadow-sm transition-all">
                                <Plus size={24} />
                            </div>
                            <span className="font-medium">Crear nuevo Dossier</span>
                        </button>
                    </div>

                    {dossiers.length === 0 && !refreshing && (
                        <div className="text-center py-12">
                            <p className="text-gray-400 text-sm">No hay expedientes activos en este laboratorio.</p>
                        </div>
                    )}
                </div>

                {/* Columna Lateral (Activity Feed) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Solo mostrar si es admin/revisor o si el usuario quiere verlo */}
                    {isReviewerOrAdmin && (
                        <RecentActivityFeed labId={currentLabId} />
                    )}

                    {/* Otros widgets futuros podrían ir aquí */}
                </div>
            </div>

            {/* Modal Crear Dossier */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center mb-4 text-gray-800">
                            <FolderOpen className="mr-2 text-blue-600" size={24} />
                            <div>
                                <h2 className="text-xl font-bold">Nuevo Expediente</h2>
                                <p className="text-xs text-gray-500">
                                    En laboratorio: <span className="font-semibold">{availableLabs.find(l => l.id === currentLabId)?.name}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selecciona el Producto
                                </label>
                                <select
                                    className="input w-full"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {products?.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre_comercial} ({p.product_type})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-2">
                                    * Solo se pueden crear dossiers para productos registrados en este laboratorio.
                                </p>
                            </div>

                            <div className="flex space-x-3 pt-4 border-t mt-4">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateDossier}
                                    disabled={!selectedProductId || loading}
                                    className="btn-primary flex-1"
                                >
                                    {loading ? 'Creando...' : 'Crear Expediente'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
