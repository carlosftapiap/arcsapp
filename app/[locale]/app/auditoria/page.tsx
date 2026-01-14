'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
    Upload, FileText, AlertTriangle, CheckCircle2, 
    Info, Clock, FileSearch, ChevronDown, ChevronUp,
    Download, Loader2, History, Eye, ShieldAlert
} from 'lucide-react';

interface StageMissing {
    stage_code: string;
    stage_name: string;
    module: string;
    is_required: boolean;
}

interface AuditResult {
    id?: string;
    product_name: string;
    manufacturer?: string;
    total_pages: number;
    stages_found: StageFound[];
    stages_missing?: StageMissing[];
    problems_found: ProblemFound[];
    summary: string;
    processing_info: {
        chunks_processed: number;
        total_chars: number;
        processing_time_ms: number;
    };
}

interface StageFound {
    stage_code: string;
    stage_name: string;
    pages: number[];
    page_range: string;
    status: 'complete' | 'incomplete' | 'missing_info';
    details: string;
}

interface ProblemFound {
    type: 'critical' | 'warning' | 'info';
    description: string;
    page: number;
    stage_code?: string;
    recommendation: string;
}

interface AuditHistory {
    id: string;
    product_name: string;
    manufacturer?: string;
    file_name: string;
    total_pages: number;
    stages_found: StageFound[];
    problems_found: ProblemFound[];
    status: string;
    created_at: string;
    processing_time_ms: number;
}

interface Lab {
    id: string;
    name: string;
}

interface Product {
    id: string;
    nombre_comercial: string;
    principio_activo?: string;
    lab_id: string;
}

export default function AuditoriaPage() {
    const t = useTranslations();
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [file, setFile] = useState<File | null>(null);
    const [productName, setProductName] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    
    // Control de acceso
    const [userRole, setUserRole] = useState<string | null>(null);
    const [checkingAccess, setCheckingAccess] = useState(true);
    
    // Selectores de Lab y Producto
    const [labs, setLabs] = useState<Lab[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedLabId, setSelectedLabId] = useState<string>('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState('');
    const [result, setResult] = useState<AuditResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedStages, setExpandedStages] = useState<Set<string>>(new Set());
    
    // Historial de auditorías
    const [auditHistory, setAuditHistory] = useState<AuditHistory[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(searchParams.get('tab') === 'historial');
    const [autoShowResult, setAutoShowResult] = useState(searchParams.get('tab') === 'historial');

    // Verificar acceso - solo super_admin
    useEffect(() => {
        const checkAccess = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                router.push('/app');
                return;
            }
            
            // Verificar si es super_admin por email o por rol en profiles
            const isSuperAdminByEmail = user.email === 'admin@arcsapp.com';
            
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();
            
            if (isSuperAdminByEmail || profile?.role === 'super_admin') {
                setUserRole('super_admin');
                setCheckingAccess(false);
                loadAuditHistory();
                loadLabs();
                loadProducts();
            } else {
                setUserRole(profile?.role || 'unknown');
                setCheckingAccess(false);
            }
        };
        
        checkAccess();
    }, [router]);

    // Filtrar productos cuando cambia el lab seleccionado
    useEffect(() => {
        if (selectedLabId) {
            setFilteredProducts(products.filter(p => p.lab_id === selectedLabId));
        } else {
            setFilteredProducts(products);
        }
        setSelectedProductId(''); // Reset producto al cambiar lab
    }, [selectedLabId, products]);

    // Actualizar nombre del producto cuando se selecciona
    useEffect(() => {
        if (selectedProductId) {
            const product = products.find(p => p.id === selectedProductId);
            if (product) {
                setProductName(product.nombre_comercial);
            }
        }
    }, [selectedProductId, products]);

    // Actualizar fabricante cuando se selecciona lab
    useEffect(() => {
        if (selectedLabId) {
            const lab = labs.find(l => l.id === selectedLabId);
            if (lab) {
                setManufacturer(lab.name);
            }
        }
    }, [selectedLabId, labs]);

    const loadLabs = async () => {
        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data } = await supabase.from('labs').select('id, name').order('name');
            setLabs(data || []);
        } catch (err) {
            console.error('Error loading labs:', err);
        }
    };

    const loadProducts = async () => {
        try {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            const { data } = await supabase.from('products').select('id, nombre_comercial, principio_activo, lab_id').order('nombre_comercial');
            setProducts(data || []);
        } catch (err) {
            console.error('Error loading products:', err);
        }
    };

    const loadAuditHistory = async () => {
        setLoadingHistory(true);
        try {
            const response = await fetch('/api/audit/history');
            const data = await response.json();
            if (data.success) {
                setAuditHistory(data.data || []);
            }
        } catch (err) {
            console.error('Error loading history:', err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const viewAuditDetails = (audit: AuditHistory) => {
        setResult({
            id: audit.id,
            product_name: audit.product_name,
            manufacturer: audit.manufacturer,
            total_pages: audit.total_pages,
            stages_found: audit.stages_found || [],
            problems_found: audit.problems_found || [],
            summary: '',
            processing_info: {
                chunks_processed: 0,
                total_chars: 0,
                processing_time_ms: audit.processing_time_ms || 0
            }
        });
        setShowHistory(false);
    };

    // Auto-mostrar resultado de la última auditoría si viene del dossier
    useEffect(() => {
        if (autoShowResult && auditHistory.length > 0 && !result) {
            viewAuditDetails(auditHistory[0]);
            setAutoShowResult(false);
        }
    }, [auditHistory, autoShowResult]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
                setError('Solo se permiten archivos PDF');
                return;
            }
            setFile(selectedFile);
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!file) return;
        if (!selectedLabId) {
            setError('Seleccione un laboratorio');
            return;
        }
        if (!selectedProductId) {
            setError('Seleccione un producto');
            return;
        }
        
        setIsAnalyzing(true);
        setError(null);
        setProgress('Leyendo archivo...');
        
        try {
            // Usar FormData para enviar archivos grandes via API Route
            const formData = new FormData();
            formData.append('file', file);
            formData.append('productName', productName.trim());
            formData.append('manufacturer', manufacturer.trim());
            formData.append('labId', selectedLabId);
            formData.append('productId', selectedProductId);
            
            setProgress('Analizando documento con IA... (esto puede tomar varios minutos)');
            
            const response = await fetch('/api/audit', {
                method: 'POST',
                body: formData,
            });
            
            const data = await response.json();
            
            if (data.success && data.data) {
                setResult(data.data);
                setProgress('');
                // Recargar historial después de guardar
                loadAuditHistory();
            } else {
                setError(data.error || 'Error desconocido');
            }
        } catch (err: any) {
            setError(err.message || 'Error al procesar el archivo');
        } finally {
            setIsAnalyzing(false);
            setProgress('');
        }
    };

    const toggleStage = (code: string) => {
        const newExpanded = new Set(expandedStages);
        if (newExpanded.has(code)) {
            newExpanded.delete(code);
        } else {
            newExpanded.add(code);
        }
        setExpandedStages(newExpanded);
    };

    const getProblemIcon = (type: string) => {
        switch (type) {
            case 'critical': return <AlertTriangle className="text-red-500" size={18} />;
            case 'warning': return <AlertTriangle className="text-amber-500" size={18} />;
            default: return <Info className="text-blue-500" size={18} />;
        }
    };

    const getProblemBg = (type: string) => {
        switch (type) {
            case 'critical': return 'bg-red-50 border-red-200';
            case 'warning': return 'bg-amber-50 border-amber-200';
            default: return 'bg-blue-50 border-blue-200';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'complete':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">Completo</span>;
            case 'incomplete':
                return <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">Incompleto</span>;
            default:
                return <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">Info Faltante</span>;
        }
    };

    const exportToJSON = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `auditoria_${file?.name || 'resultado'}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Pantalla de carga mientras verifica acceso
    if (checkingAccess) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <Loader2 className="animate-spin mx-auto text-indigo-600" size={32} />
                    <p className="text-gray-500 mt-2">Verificando acceso...</p>
                </div>
            </div>
        );
    }

    // Pantalla de acceso denegado
    if (userRole !== 'super_admin') {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-red-200">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <ShieldAlert className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
                    <p className="text-gray-600 mb-4">
                        Esta función está disponible únicamente para administradores del sistema.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        Tu rol actual: <span className="font-medium">{userRole || 'No definido'}</span>
                    </p>
                    <button
                        onClick={() => router.push('/app')}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 rounded-xl">
                    <FileSearch className="text-indigo-600" size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Auditoría de Documentos</h1>
                    <p className="text-gray-500">Analiza PDFs grandes y detecta etapas ARCSA con sus páginas</p>
                </div>
            </div>

            {/* Tabs: Nueva Auditoría / Historial */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => {
                        setShowHistory(false);
                        setResult(null); // Limpiar resultados anteriores
                        setError(null);
                        setProgress('');
                    }}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                        !showHistory 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Upload size={16} className="inline mr-2" />
                    Nueva Auditoría
                </button>
                <button
                    onClick={() => setShowHistory(true)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                        showHistory 
                            ? 'border-indigo-600 text-indigo-600' 
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <History size={16} />
                    Historial ({auditHistory.length})
                </button>
            </div>

            {/* Historial de auditorías */}
            {showHistory && (
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <History size={20} className="text-gray-400" />
                            Auditorías Anteriores
                        </h2>
                        <button
                            onClick={loadAuditHistory}
                            disabled={loadingHistory}
                            className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                            {loadingHistory ? <Loader2 size={14} className="animate-spin" /> : null}
                            Actualizar
                        </button>
                    </div>

                    {loadingHistory ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-indigo-600" size={32} />
                        </div>
                    ) : auditHistory.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <FileSearch size={48} className="mx-auto mb-3 text-gray-300" />
                            <p>No hay auditorías anteriores</p>
                            <p className="text-sm">Las auditorías que realices aparecerán aquí</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {auditHistory.map((audit) => (
                                <div 
                                    key={audit.id} 
                                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900">{audit.product_name}</h3>
                                            {audit.manufacturer && (
                                                <p className="text-sm text-gray-500">{audit.manufacturer}</p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-1">
                                                {audit.file_name} · {audit.total_pages} páginas
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400">
                                                {new Date(audit.created_at).toLocaleDateString('es-EC', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                    {(audit.stages_found || []).length} etapas
                                                </span>
                                                {(audit.problems_found || []).filter((p: ProblemFound) => p.type === 'critical').length > 0 && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                                        {(audit.problems_found || []).filter((p: ProblemFound) => p.type === 'critical').length} críticos
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => viewAuditDetails(audit)}
                                        className="mt-3 w-full px-3 py-2 text-sm bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Eye size={16} />
                                        Ver Detalles
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Upload Section */}
            {!showHistory && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Upload size={20} className="text-gray-400" />
                    Subir Documento
                </h2>

                {/* Campos de identificación del medicamento */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Laboratorio <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedLabId}
                            onChange={(e) => setSelectedLabId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isAnalyzing}
                        >
                            <option value="">Seleccionar laboratorio...</option>
                            {labs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Producto <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            disabled={isAnalyzing || !selectedLabId}
                        >
                            <option value="">{selectedLabId ? 'Seleccionar producto...' : 'Primero seleccione un laboratorio'}</option>
                            {filteredProducts.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.nombre_comercial} {product.principio_activo ? `(${product.principio_activo})` : ''}
                                </option>
                            ))}
                        </select>
                        {selectedLabId && filteredProducts.length === 0 && (
                            <p className="text-xs text-amber-600 mt-1">No hay productos para este laboratorio. Cree uno primero.</p>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 items-start">
                    <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors">
                        <input 
                            type="file" 
                            accept=".pdf" 
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isAnalyzing}
                        />
                        <FileText className="mx-auto text-gray-400 mb-3" size={40} />
                        {file ? (
                            <div>
                                <p className="font-medium text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-medium text-gray-700">Arrastra un PDF o haz clic para seleccionar</p>
                                <p className="text-sm text-gray-500 mt-1">Soporta documentos de más de 150 páginas</p>
                            </div>
                        )}
                    </label>
                    
                    <button
                        onClick={handleAnalyze}
                        disabled={!file || isAnalyzing}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Analizando...
                            </>
                        ) : (
                            <>
                                <FileSearch size={20} />
                                Iniciar Auditoría
                            </>
                        )}
                    </button>
                </div>

                {/* Progress */}
                {progress && (
                    <div className="mt-4 flex items-center gap-2 text-indigo-600">
                        <Loader2 className="animate-spin" size={16} />
                        <span>{progress}</span>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        <p className="font-medium">Error en el análisis</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}
            </div>
            )}

            {/* Results Section */}
            {result && (
                <>
                    {/* Summary */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <CheckCircle2 size={20} className="text-green-500" />
                                Resumen de Auditoría
                            </h2>
                            <button
                                onClick={exportToJSON}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                            >
                                <Download size={14} />
                                Exportar JSON
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-2xl font-bold text-gray-900">{result.total_pages}</p>
                                <p className="text-sm text-gray-500">Páginas analizadas</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-2xl font-bold text-green-600">{result.stages_found.length}</p>
                                <p className="text-sm text-gray-500">Etapas encontradas</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border-2 border-amber-200">
                                <p className="text-2xl font-bold text-amber-600">{result.stages_missing?.length || 0}</p>
                                <p className="text-sm text-gray-500">Docs faltantes</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <p className="text-2xl font-bold text-red-600">
                                    {result.problems_found.filter(p => p.type === 'critical').length}
                                </p>
                                <p className="text-sm text-gray-500">Problemas críticos</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-600">
                                    {result.problems_found.filter(p => p.type === 'warning').length}
                                </p>
                                <p className="text-sm text-gray-500">Advertencias</p>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <Clock size={14} />
                                {(result.processing_info.processing_time_ms / 1000).toFixed(1)}s
                            </span>
                            <span>{result.processing_info.chunks_processed} chunks procesados</span>
                            <span>{(result.processing_info.total_chars / 1000).toFixed(0)}K caracteres</span>
                        </div>
                    </div>

                    {/* Stages Found */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-gray-400" />
                            Etapas Detectadas ({result.stages_found.length})
                        </h2>
                        
                        <div className="space-y-2">
                            {result.stages_found.map((stage) => (
                                <div key={stage.stage_code} className="border border-gray-200 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleStage(stage.stage_code)}
                                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                                {stage.stage_code}
                                            </span>
                                            <span className="font-medium">{stage.stage_name}</span>
                                            {getStatusBadge(stage.status)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm text-gray-500">
                                                Págs. {stage.page_range}
                                            </span>
                                            {expandedStages.has(stage.stage_code) ? (
                                                <ChevronUp size={18} className="text-gray-400" />
                                            ) : (
                                                <ChevronDown size={18} className="text-gray-400" />
                                            )}
                                        </div>
                                    </button>
                                    
                                    {expandedStages.has(stage.stage_code) && (
                                        <div className="px-4 py-3 bg-white border-t border-gray-100">
                                            <p className="text-sm text-gray-700">{stage.details}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                Páginas: {stage.pages.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            
                            {result.stages_found.length === 0 && (
                                <p className="text-gray-500 text-center py-8">No se detectaron etapas en el documento</p>
                            )}
                        </div>
                    </div>

                    {/* Stages Missing */}
                    {result.stages_missing && result.stages_missing.length > 0 && (
                        <div className="bg-white rounded-xl border-2 border-amber-300 p-6 shadow-sm">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle size={20} className="text-amber-500" />
                                Documentos Faltantes ({result.stages_missing.length})
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {result.stages_missing.map((stage) => (
                                    <div 
                                        key={stage.stage_code} 
                                        className="p-3 rounded-lg border border-amber-200 bg-amber-50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="font-mono text-sm font-semibold text-amber-800">{stage.stage_code}</span>
                                                <p className="text-sm text-gray-700">{stage.stage_name}</p>
                                            </div>
                                            <span className="text-xs px-2 py-0.5 rounded bg-amber-200 text-amber-800">
                                                {stage.module}
                                            </span>
                                        </div>
                                        {stage.is_required && (
                                            <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Documento requerido</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                                <p className="text-sm text-amber-800">
                                    <strong>Importante:</strong> Estos documentos no fueron encontrados en el PDF analizado. 
                                    Asegúrese de incluirlos antes de presentar el dossier.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Problems Found */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle size={20} className="text-amber-500" />
                            Problemas Detectados ({result.problems_found.length})
                        </h2>
                        
                        <div className="space-y-3">
                            {result.problems_found.map((problem, idx) => (
                                <div 
                                    key={idx} 
                                    className={`p-4 rounded-lg border ${getProblemBg(problem.type)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {getProblemIcon(problem.type)}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-gray-900">{problem.description}</span>
                                                {problem.stage_code && (
                                                    <span className="text-xs font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                                                        {problem.stage_code}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">{problem.recommendation}</p>
                                            <p className="text-xs text-gray-400 mt-1">Página {problem.page}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {result.problems_found.length === 0 && (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="mx-auto text-green-500 mb-2" size={32} />
                                    <p className="text-gray-500">No se detectaron problemas en el documento</p>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
