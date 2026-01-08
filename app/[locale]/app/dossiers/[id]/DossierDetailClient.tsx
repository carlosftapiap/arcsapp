'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import {
    ChevronLeft, FileText, Upload, CheckCircle2, AlertCircle,
    Clock, Eye, Trash2, Download, RefreshCw, Bot, X, Languages
} from 'lucide-react';
import Link from 'next/link';
import { runAIAnalysis } from '@/app/[locale]/app/dossiers/actions/ai-analysis';
import { runAIAnalysisV2 } from '@/app/[locale]/app/dossiers/actions/ai-analysis-v2';
import { runAIAnalysisForItem } from '@/app/[locale]/app/dossiers/actions/ai-analysis-item';
import { saveReviewWithTranslation } from '@/app/[locale]/app/dossiers/actions/translate';

// Interfaces Actualizadas
interface AIAnalysis {
    id: string;
    status: string;
    alerts: { type: string; message: string }[];
    created_at: string;
    analysis_json?: any; // Contains structured analysis data
}

interface TechnicalReview {
    id: string;
    decision: 'approved' | 'observed' | 'rejected';
    comments: string;
    comments_i18n?: { es?: string; en?: string; hi?: string; 'zh-CN'?: string };
    created_at: string;
    reviewer_id: string;
    version_reviewed: number;
}

interface Document {
    id: string;
    file_path: string;
    version: number;
    uploaded_at: string;
    status: string;
    ai_document_analyses?: AIAnalysis[];
    technical_reviews?: TechnicalReview[];
}

interface ChecklistItem {
    id: string; // ID real en tabla checklist_items
    code: string;
    module: string;
    title_i18n_json: { es: string; en: string };
    required: boolean;
    critical: boolean;
    sort_order: number;
    allows_multiple_files?: boolean; // Indica si permite múltiples archivos
}

interface DossierItem {
    id: string; // ID en dossier_items
    status: string; // pending, uploaded, approved, observed
    checklist_item: ChecklistItem;
    documents: Document[]; // Array de docs subidos ordenados por fecha desc
    reviewer_notes?: string; // Legacy support
    review_status?: string; // Legacy support
}

interface Dossier {
    id: string;
    product_name: string;
    product_type: string;
    status: string;
    created_at: string;
    lab_id: string; // Needed for verify permissions
}

interface Props {
    dossier: Dossier;
    initialItems: DossierItem[];
    userRole: string;
}

// Helper: Colores por módulo (tonos más fuertes)
function getModuleColors(moduleName: string): { bg: string; border: string; text: string; icon: string } {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
        'Legal': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900', icon: '⚖️' },
        'Quality': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', icon: '🔬' },
        'Efficacy': { bg: 'bg-green-100', border: 'border-green-400', text: 'text-green-900', icon: '💊' },
        'Safety': { bg: 'bg-red-100', border: 'border-red-400', text: 'text-red-900', icon: '🛡️' },
        'General': { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-900', icon: '📋' },
        'Administrativo': { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-900', icon: '📝' },
        'Técnico': { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-900', icon: '⚙️' },
        'Calidad': { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-900', icon: '🔬' },
        'Fabricante': { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-900', icon: '🏭' },
        'Otros': { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-900', icon: '📁' },
    };
    return colors[moduleName] || colors['General'];
}

// Helper: Formatear análisis JSON a texto legible (con traducciones)
function formatAnalysisToText(data: any, t: (key: string) => string): string {
    if (!data) return t('ai.noData') || 'Sin datos de análisis';
    
    let text = '';
    
    // Conclusión principal
    if (data.conclusion || data.conclusión) {
        text += `📋 ${t('ai.conclusion')}\n${data.conclusion || data.conclusión}\n\n`;
    }
    
    // Estado de la etapa
    if (data.estado_etapa) {
        const emoji = data.estado_etapa === 'COMPLETA' ? '✅' : data.estado_etapa === 'OBSERVADA' ? '⚠️' : '❌';
        text += `${emoji} ${t('ai.status')}: ${data.estado_etapa}\n\n`;
    }
    
    // Tipo de documento detectado
    if (data.tipo_detectado) {
        text += `📄 ${t('ai.typeDetected')}: ${data.tipo_detectado}\n`;
    }
    
    // Coincidencia con requisito
    if (typeof data.coincide_con_requisito === 'boolean') {
        const yesNo = data.coincide_con_requisito ? t('ai.yes') : t('ai.no');
        text += `${data.coincide_con_requisito ? '✅' : '❌'} ${t('ai.matchesRequirement')}: ${yesNo}\n\n`;
    }
    
    // Archivos analizados
    if (data.archivos_analizados?.length) {
        text += `📁 ${t('ai.filesAnalyzed')} (${data.archivos_analizados.length})\n`;
        text += '─'.repeat(40) + '\n';
        data.archivos_analizados.forEach((archivo: any, i: number) => {
            text += `\n${i + 1}. ${archivo.nombre || 'Archivo ' + (i + 1)}\n`;
            if (archivo.tipo_documento) text += `   ${t('ai.type')}: ${archivo.tipo_documento}\n`;
            if (archivo.datos_extraidos) {
                const d = archivo.datos_extraidos;
                if (d.fabricante) text += `   ${t('ai.manufacturer')}: ${d.fabricante}\n`;
                if (d.lote) text += `   ${t('ai.batch')}: ${d.lote}\n`;
                if (d.api_asociado) text += `   ${t('ai.api')}: ${d.api_asociado}\n`;
                if (d.fecha_emision) text += `   ${t('ai.issueDate')}: ${d.fecha_emision}\n`;
                if (d.fecha_vencimiento) text += `   ${t('ai.expiryDate')}: ${d.fecha_vencimiento}\n`;
            }
        });
        text += '\n';
    }
    
    // Datos para cruce
    if (data.datos_para_cruce) {
        const cruce = data.datos_para_cruce;
        text += `🔗 ${t('ai.crossData')}\n`;
        text += '─'.repeat(40) + '\n';
        if (cruce.apis_detectados?.length) text += `   ${t('ai.apis')}: ${cruce.apis_detectados.join(', ')}\n`;
        if (cruce.lotes_detectados?.length) text += `   ${t('ai.batches')}: ${cruce.lotes_detectados.join(', ')}\n`;
        if (cruce.fabricantes_detectados?.length) text += `   ${t('ai.manufacturers')}: ${cruce.fabricantes_detectados.join(', ')}\n`;
        text += '\n';
    }
    
    // Validaciones
    if (data.validaciones) {
        const v = data.validaciones;
        if (v.conformes?.length) {
            text += `✅ ${t('ai.conforming')}\n`;
            v.conformes.forEach((item: any) => {
                text += `   • ${item.item}: ${item.detalle}\n`;
            });
            text += '\n';
        }
        if (v.observaciones?.length) {
            text += `⚠️ ${t('ai.observations')}\n`;
            v.observaciones.forEach((item: any) => {
                text += `   • ${item.item}: ${item.detalle}\n`;
            });
            text += '\n';
        }
        if (v.errores_criticos?.length) {
            text += `❌ ${t('ai.criticalErrors')}\n`;
            v.errores_criticos.forEach((item: any) => {
                text += `   • ${item.item}: ${item.detalle}\n`;
                if (item.bloquea_tramite) text += `     ⛔ ${t('ai.blocksProcess')}\n`;
            });
            text += '\n';
        }
    }
    
    // Alertas
    if (data.alertas?.length) {
        text += `🔔 ${t('ai.alerts')}\n`;
        data.alertas.forEach((alerta: any) => {
            const emoji = alerta.type === 'error' ? '❌' : alerta.type === 'warning' ? '⚠️' : 'ℹ️';
            text += `   ${emoji} ${alerta.message}\n`;
        });
        text += '\n';
    }
    
    // Fechas legacy
    if (data.fecha_emision && !data.archivos_analizados) {
        text += `📅 ${t('ai.issueDate')}: ${data.fecha_emision}\n`;
    }
    if (data.fecha_vencimiento && !data.archivos_analizados) {
        text += `📅 ${t('ai.expiryDate')}: ${data.fecha_vencimiento}\n`;
    }
    
    // Meta info
    if (data._meta) {
        text += `\n─────────────────────────────────────────\n`;
        text += `ℹ️ ${t('ai.stage')}: ${data._meta.stageCode || 'N/A'}\n`;
        text += `ℹ️ ${t('ai.multiFile')}: ${data._meta.isMultiFile ? t('ai.yes') : t('ai.no')}\n`;
        if (data._meta.filesAnalyzed?.length) {
            text += `ℹ️ ${t('ai.files')}: ${data._meta.filesAnalyzed.join(', ')}\n`;
        }
    }
    
    return text || JSON.stringify(data, null, 2);
}

export default function DossierDetailClient({ dossier, initialItems, userRole }: Props) {
    console.log("Rendering DossierDetailClient Clean Reconstruction");
    const t = useTranslations();
    const locale = useLocale();
    const [items, setItems] = useState<DossierItem[]>(initialItems);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [uploadingItemId, setUploadingItemId] = useState<string | null>(null);
    const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null); // Re-add for safety if used

    // Estado para formulario de revisión
    const [reviewComment, setReviewComment] = useState('');
    const [reviewDecision, setReviewDecision] = useState<'approved' | 'observed' | null>(null);
    const [reviewNotes, setReviewNotes] = useState(''); // Legacy state support
    const [jsonModalData, setJsonModalData] = useState<any | null>(null);

    // Permisos
    const isSuperAdmin = userRole === 'super_admin';
    const isReviewer = ['reviewer', 'lab_admin', 'super_admin'].includes(userRole);
    const isUploader = ['lab_uploader', 'lab_admin', 'super_admin'].includes(userRole);

    // DEBUG: Ver qué llega
    console.log("DossierDetailClient items:", items);

    // Protective check for empty items
    if (!items || items.length === 0) {
        return (
            <div className="space-y-6 pb-20">
                <div className="flex items-center gap-4">
                    <Link href="/app/dossiers" className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></Link>
                    <div><h1 className="text-2xl font-bold text-gray-900">{dossier.product_name}</h1></div>
                </div>
                <div className="p-12 text-center bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No se encontraron requisitos en este dossier.</p>
                </div>
            </div>
        );
    }

    // Agrupar items por módulo (safe check)
    const groupedItems = items.reduce((acc, item) => {
        // Fallback robusto si checklist_item viene nulo
        const module = item.checklist_item?.module || 'Otros';
        if (!acc[module]) acc[module] = [];
        acc[module].push(item);
        return acc;
    }, {} as Record<string, DossierItem[]>);

    // Ordenar módulos
    const moduleOrder = ['Legal', 'Quality', 'Efficacy', 'Safety', 'General'];
    const sortedModules = Object.keys(groupedItems).sort((a, b) => moduleOrder.indexOf(a) - moduleOrder.indexOf(b));

    // Progress - Documentos subidos
    const totalRequired = items.filter(i => i.checklist_item.required).length;
    const uploadedRequired = items.filter(i => i.checklist_item.required && (i.status === 'uploaded' || i.status === 'approved')).length;
    const uploadProgress = totalRequired > 0 ? Math.round((uploadedRequired / totalRequired) * 100) : 0;
    
    // Progress - Documentos aprobados por técnico
    const approvedRequired = items.filter(i => i.checklist_item.required && i.status === 'approved').length;
    const approvalProgress = totalRequired > 0 ? Math.round((approvedRequired / totalRequired) * 100) : 0;

    const handleDownload = async (filePath: string, fileName: string) => {
        const supabase = createClient();
        try {
            const { data, error } = await supabase.storage
                .from('dossier-documents')
                .download(filePath);

            if (error) throw error;

            // Create download link
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName || filePath.split('/').pop() || 'documento');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            console.error('Error downloading:', error);
            alert('Error al descargar el archivo.');
        }
    };

    const handlePreview = async (filePath: string) => {
        const supabase = createClient();
        try {
            // Obtener URL firmada temporal (válida por 1 hora)
            const { data, error } = await supabase.storage
                .from('dossier-documents')
                .createSignedUrl(filePath, 3600); // 3600 segundos = 1 hora

            if (error) throw error;
            if (!data?.signedUrl) throw new Error('No se pudo generar URL de vista previa');

            // Abrir en nueva pestaña
            window.open(data.signedUrl, '_blank');
        } catch (error: any) {
            console.error('Error previewing:', error);
            alert('Error al abrir vista previa: ' + error.message);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, dossierItemId: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingItemId(dossierItemId);
        const supabase = createClient();
        
        try {
            const currentItem = items.find(i => i.id === dossierItemId);
            const isMultiFile = currentItem?.checklist_item?.allows_multiple_files || false;
            const itemCode = currentItem?.checklist_item.code || 'unknown';
            
            const uploadedDocs: Document[] = [];
            
            // Procesar cada archivo
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                // Para multi-archivo: cada archivo es independiente (no versiones)
                // Para archivo único: incrementar versión
                const nextVersion = isMultiFile 
                    ? 1 
                    : (currentItem?.documents?.[0]?.version || 0) + 1;
                
                const fileIndex = isMultiFile ? `_f${(currentItem?.documents?.length || 0) + i + 1}` : '';
                // Sanitizar nombre de archivo: remover caracteres especiales
                const sanitizedFileName = file.name
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remover acentos
                    .replace(/[^a-zA-Z0-9._-]/g, '_') // Reemplazar caracteres especiales con _
                    .replace(/_+/g, '_'); // Evitar múltiples guiones bajos seguidos
                const filePath = `dossiers/${dossier.id}/${itemCode}/v${nextVersion}${fileIndex}_${Date.now()}_${sanitizedFileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('dossier-documents')
                    .upload(filePath, file);
                    
                if (uploadError) throw uploadError;

                const { data: docData, error: dbError } = await supabase
                    .from('documents')
                    .insert([{
                        dossier_item_id: dossierItemId,
                        file_path: filePath,
                        version: nextVersion,
                        status: 'active'
                    }])
                    .select('*, ai_document_analyses(*), technical_reviews(*)')
                    .single();

                if (dbError) throw dbError;
                uploadedDocs.push(docData as Document);
            }

            // Actualizar estado del Item a 'uploaded'
            await supabase.from('dossier_items').update({ status: 'uploaded' }).eq('id', dossierItemId);

            // Actualizar UI
            setItems(prev => prev.map(i => {
                if (i.id === dossierItemId) {
                    return {
                        ...i,
                        status: 'uploaded',
                        documents: [...uploadedDocs, ...(i.documents || [])]
                    };
                }
                return i;
            }));
            
            const msg = files.length > 1 
                ? `${files.length} archivos subidos correctamente.`
                : `Archivo subido correctamente.`;
            alert(msg);
            
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setUploadingItemId(null);
            // Limpiar input para permitir subir el mismo archivo de nuevo
            e.target.value = '';
        }
    };

    const [savingReview, setSavingReview] = useState(false);

    const handleSubmitReview = async (itemId: string, documentId: string) => {
        if (!reviewDecision) return;
        if (reviewDecision === 'observed' && !reviewComment) {
            alert('La observación es obligatoria');
            return;
        }

        setSavingReview(true);
        const supabase = createClient();

        try {
            // Obtener usuario actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Error: No se pudo obtener el usuario actual');
                return;
            }

            const versionReviewed = items.find(i => i.id === itemId)?.documents[0]?.version || 1;

            // Usar la función con traducción automática
            const result = await saveReviewWithTranslation(
                documentId,
                user.id,
                reviewDecision,
                reviewComment,
                versionReviewed,
                locale,
                dossier.lab_id
            );

            if (!result.success) {
                throw new Error(result.error || 'Error al guardar dictamen');
            }

            const newReview = result.data;

            // Actualizar Estado Maestro del Item
            const newStatus = reviewDecision === 'approved' ? 'approved' : 'observed';
            await supabase.from('dossier_items').update({ status: newStatus }).eq('id', itemId);

            // Actualizar UI
            setItems(prev => prev.map(i => {
                if (i.id === itemId) {
                    const updatedDocs = [...i.documents];
                    if (updatedDocs.length > 0) {
                        updatedDocs[0] = {
                            ...updatedDocs[0],
                            technical_reviews: [newReview, ...(updatedDocs[0].technical_reviews || [])]
                        };
                    }
                    return { ...i, status: newStatus, documents: updatedDocs };
                }
                return i;
            }));

            setReviewDecision(null);
            setReviewComment('');
            alert('Dictamen registrado y traducido automáticamente.');

        } catch (error: any) {
            alert(error.message);
        } finally {
            setSavingReview(false);
        }
    };

    // ...

    const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
    const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);
    const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

    // ...

    const handleDeleteDocument = async (docId: string, filePath: string, dossierItemId: string) => {
        if (!confirm('¿Está seguro de eliminar este documento? Esta acción no se puede deshacer.')) return;
        
        setDeletingDocId(docId);
        const supabase = createClient();
        
        try {
            // 1. Eliminar archivo del storage
            const { error: storageError } = await supabase.storage
                .from('dossier-documents')
                .remove([filePath]);
            
            if (storageError) {
                console.warn('Error eliminando archivo del storage:', storageError);
            }
            
            // 2. Eliminar registro de la base de datos
            const { error: dbError } = await supabase
                .from('documents')
                .delete()
                .eq('id', docId);
            
            if (dbError) throw dbError;
            
            // 3. Actualizar estado del dossier_item a 'pending' si no quedan documentos
            const currentItem = items.find(i => i.id === dossierItemId);
            const remainingDocs = (currentItem?.documents || []).filter(d => d.id !== docId);
            
            if (remainingDocs.length === 0) {
                await supabase.from('dossier_items').update({ status: 'pending' }).eq('id', dossierItemId);
            }
            
            // 4. Actualizar UI
            setItems(prev => prev.map(i => {
                if (i.id === dossierItemId) {
                    const newDocs = i.documents.filter(d => d.id !== docId);
                    return {
                        ...i,
                        status: newDocs.length === 0 ? 'pending' : i.status,
                        documents: newDocs
                    };
                }
                return i;
            }));
            
            alert('Documento eliminado correctamente.');
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message);
        } finally {
            setDeletingDocId(null);
        }
    };

    const handleRunAI = async (docId: string) => {
        setAnalyzingDocId(docId);
        try {
            // Usar función original que funciona para single-file
            const result = await runAIAnalysis(docId);

            if (result.success) {
                // Actualizar estado local con el nuevo análisis
                setItems(prev => prev.map(item => {
                    const docIndex = item.documents?.findIndex(d => d.id === docId);
                    if (docIndex !== undefined && docIndex !== -1) {
                        const newDocs = [...item.documents];
                        const newAnalyses = [
                            result.data,
                            ...(newDocs[docIndex].ai_document_analyses || [])
                        ];
                        // Mapear resultado a la interfaz AIAnalysis
                        newDocs[docIndex] = {
                            ...newDocs[docIndex],
                            ai_document_analyses: newAnalyses as any // Cast temporal
                        };
                        return { ...item, documents: newDocs };
                    }
                    return item;
                }));
                alert("Análisis de IA completado exitosamente.");
            } else {
                alert("Error en el análisis de IA: " + result.error);
            }
        } catch (error: any) {
            alert("Error inesperado: " + error.message);
        } finally {
            setAnalyzingDocId(null);
        }
    };

    // Handler para análisis de etapa completa (todos los archivos)
    const handleRunAIForItem = async (itemId: string) => {
        setAnalyzingItemId(itemId);
        try {
            const result = await runAIAnalysisForItem(itemId);

            if (result.success && result.data) {
                // Refrescar la página para ver el resultado
                window.location.reload();
            } else {
                alert("Error en el análisis de etapa: " + result.error);
            }
        } catch (error: any) {
            alert("Error inesperado: " + error.message);
        } finally {
            setAnalyzingItemId(null);
        }
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Reducido */}
            <div className="flex items-center gap-4">
                <Link href={`/${locale}/app/dossiers`} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ChevronLeft size={24} /></Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{dossier.product_name}</h1>
                    <p className="text-sm text-gray-500">{t(`productTypes.${dossier.product_type}`)}</p>
                </div>
            </div>

            {/* Progress Bars */}
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-4">
                {/* Barra 1: Documentos Subidos */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            📤 {t('dossiers.progressUpload')}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ${uploadProgress === 100 ? 'bg-blue-500' : uploadProgress >= 50 ? 'bg-blue-400' : 'bg-blue-300'}`}
                            style={{ width: `${uploadProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {uploadedRequired} / {totalRequired} {t('dossiers.uploaded')}
                    </p>
                </div>

                {/* Barra 2: Documentos Aprobados */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            ✅ {t('dossiers.progressApproval')}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{approvalProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-3 rounded-full transition-all duration-500 ${approvalProgress === 100 ? 'bg-green-500' : approvalProgress >= 50 ? 'bg-green-400' : 'bg-green-300'}`}
                            style={{ width: `${approvalProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        {approvedRequired} / {totalRequired} {t('dossiers.approved')}
                    </p>
                </div>
            </div>

            {/* Modules Loop */}
            <div className="space-y-6">
                {sortedModules.map(moduleName => {
                    // Traducir nombre del módulo
                    const moduleKey = moduleName.toLowerCase();
                    const translatedModule = t(`dossiers.modules.${moduleKey}`) || moduleName;
                    const moduleColors = getModuleColors(moduleName);

                    return (
                        <div key={moduleName} className={`bg-white rounded-xl shadow-sm border-2 ${moduleColors.border} overflow-hidden`}>
                            <div className={`${moduleColors.bg} px-6 py-3 border-b ${moduleColors.border} font-semibold ${moduleColors.text} flex justify-between items-center`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{moduleColors.icon}</span>
                                    <span>{translatedModule}</span>
                                </div>
                                <span className={`text-xs font-normal ${moduleColors.text} opacity-70`}>{groupedItems[moduleName].length} {t('dossiers.items', { count: groupedItems[moduleName].length }).replace(/[0-9]+ /, '')}</span>
                            </div>

                            <div className="divide-y divide-gray-100">
                                {groupedItems[moduleName].sort((a, b) => (a.checklist_item?.sort_order || 0) - (b.checklist_item?.sort_order || 0)).map(item => {
                                    // Safety fallback
                                    const checkItem = item.checklist_item || { code: 'N/A', title_i18n_json: { es: 'Requisito desconocido' }, critical: false };

                                    const currentDoc = item.documents?.[0]; // El más reciente
                                    const hasDoc = !!currentDoc;
                                    const isExpanded = expandedItemId === item.id;

                                    // Badges Row Summary
                                    let statusBadges = null;
                                    if (!hasDoc) statusBadges = <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">{t('status.pending')}</span>;
                                    else {
                                        statusBadges = (
                                            <div className="flex gap-2 text-xs">
                                                {/* Technical Status */}
                                                {item.status === 'approved' && <span className="bg-green-100 text-green-700 px-2 rounded font-medium flex items-center">{t('status.approved')}</span>}
                                                {item.status === 'observed' && <span className="bg-red-100 text-red-700 px-2 rounded font-medium flex items-center">{t('status.observed')}</span>}
                                                {item.status === 'uploaded' && <span className="bg-blue-100 text-blue-700 px-2 rounded font-medium flex items-center">{t('status.uploaded')}</span>}

                                                {/* Version */}
                                                <span className="bg-gray-100 text-gray-600 px-2 rounded  font-mono">v{currentDoc.version}</span>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={item.id} className="group flex flex-col transition-all">

                                            {/* 1. Row Resumida (Siempre visible) */}
                                            <div
                                                className={`p-4 flex gap-4 items-start cursor-pointer hover:bg-gray-50 ${isExpanded ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                            >
                                                <div className="pt-1">
                                                    {checkItem.critical ? <AlertCircle className="text-red-400" size={18} /> : <div className="w-4 h-4 rounded-full border-2 border-gray-300" />}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-xs font-bold text-gray-500">{checkItem.code}</span>
                                                        {statusBadges}
                                                    </div>
                                                    <h3 className="text-gray-900 font-medium text-sm">{(checkItem.title_i18n_json as any)?.[locale] || checkItem.title_i18n_json?.es || checkItem.code}</h3>
                                                </div>
                                                <div className="text-gray-400">
                                                    <ChevronLeft size={20} className={`transform transition-transform ${isExpanded ? '-rotate-90' : 'rotate-180'}`} />
                                                </div>
                                            </div>

                                            {/* 2. Panel Expandido (Los 4 Bloques) */}
                                            {isExpanded && (
                                                <div className="px-4 pb-6 bg-gray-50 border-t border-gray-100 animate-in slide-in-from-top-1">
                                                    
                                                    {/* Instrucciones de la etapa - Solo visible para super_admin y usuarios del laboratorio */}
                                                    {['super_admin', 'lab_admin', 'lab_uploader', 'lab_viewer'].includes(userRole) && (
                                                        <div className="mt-3 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                                            <p className="text-sm text-blue-800">
                                                                <span className="font-medium">📋 </span>
                                                                {t(`stageInstructions.${checkItem.code}.hint`) || 'Suba el documento correspondiente a este requisito.'}
                                                            </p>
                                                            {/* multiHint deshabilitado temporalmente - solo items específicos lo tienen */}
                                                            {/* Criterios de evaluación */}
                                                            {(() => {
                                                                try {
                                                                    const evaluates = t(`stageInstructions.${checkItem.code}.evaluates`);
                                                                    if (evaluates && !evaluates.includes('stageInstructions.')) {
                                                                        return (
                                                                            <details className="mt-3 border-t border-blue-200 pt-2">
                                                                                <summary className="text-xs font-medium text-blue-900 cursor-pointer hover:text-blue-700">
                                                                                    🔍 {t('dossiers.detail.viewEvaluationCriteria')}
                                                                                </summary>
                                                                                <div className="mt-2 text-xs text-blue-800 whitespace-pre-line bg-blue-100/50 p-2 rounded">
                                                                                    {evaluates}
                                                                                </div>
                                                                            </details>
                                                                        );
                                                                    }
                                                                } catch { return null; }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}

                                                    {!hasDoc ? (
                                                        // Caso: No hay documento
                                                        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                                                            <p className="text-gray-500 mb-4">No se ha subido ningún archivo para este requisito.</p>
                                                            {isUploader && (
                                                                <>
                                                                    <input type="file" id={`upload-${item.id}`} className="hidden" accept=".pdf,.doc,.docx,.zip" multiple={checkItem.allows_multiple_files} onChange={(e) => handleFileUpload(e, item.id)} disabled={uploadingItemId === item.id} />
                                                                    <label htmlFor={`upload-${item.id}`} className="btn-primary cursor-pointer inline-flex items-center gap-2">
                                                                        <Upload size={18} /> {t('documents.upload')}
                                                                    </label>
                                                                </>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        // Caso: Hay documento (Mostrar Bloques ABCD)
                                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">

                                                            {/* Bloque A: Archivo(s) */}
                                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <h4 className="text-xs font-bold uppercase text-gray-500 tracking-wide">
                                                                        {t('dossiers.detail.blockA')}
                                                                        {checkItem.allows_multiple_files && (
                                                                            <span className="ml-2 text-[10px] font-normal bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                                                                Multi-archivo ({item.documents?.length || 0})
                                                                            </span>
                                                                        )}
                                                                    </h4>
                                                                    {/* Botón Agregar para multi-archivo */}
                                                                    {checkItem.allows_multiple_files && isUploader && item.status !== 'approved' && (
                                                                        <>
                                                                            <input 
                                                                                type="file" 
                                                                                id={`addfile-${item.id}`} 
                                                                                className="hidden" 
                                                                                accept=".pdf,.doc,.docx,.zip" 
                                                                                multiple
                                                                                onChange={(e) => handleFileUpload(e, item.id)} 
                                                                                disabled={uploadingItemId === item.id} 
                                                                            />
                                                                            <label 
                                                                                htmlFor={`addfile-${item.id}`} 
                                                                                className="text-xs btn-primary py-1 px-3 flex items-center gap-1 cursor-pointer bg-green-600 hover:bg-green-700"
                                                                            >
                                                                                <Upload size={14} /> Agregar archivo
                                                                            </label>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Lista de documentos */}
                                                                <div className={`space-y-3 ${checkItem.allows_multiple_files && item.documents?.length > 2 ? 'max-h-64 overflow-y-auto pr-2' : ''}`}>
                                                                    {(checkItem.allows_multiple_files ? item.documents : [currentDoc]).map((doc, docIndex) => (
                                                                        <div key={doc.id} className={`flex items-start gap-3 ${docIndex > 0 ? 'pt-3 border-t border-gray-100' : ''}`}>
                                                                            <div className="p-2 bg-red-50 rounded text-red-600 flex-shrink-0">
                                                                                <FileText size={20} />
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-sm font-medium text-gray-900 truncate" title={doc.file_path}>
                                                                                    {doc.file_path.split('/').pop()}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {checkItem.allows_multiple_files ? `Archivo ${docIndex + 1}` : `Versión ${doc.version}`} • {new Date(doc.uploaded_at).toLocaleDateString()}
                                                                                </p>
                                                                                <div className="flex flex-wrap gap-2 mt-2">
                                                                                    <button
                                                                                        onClick={() => handlePreview(doc.file_path)}
                                                                                        className="text-xs btn-secondary py-1 px-2 flex items-center gap-1 bg-blue-50 text-blue-600 hover:bg-blue-100"
                                                                                        title="Vista previa"
                                                                                    >
                                                                                        <Eye size={12} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDownload(doc.file_path, doc.file_path.split('/').pop() || 'download')}
                                                                                        className="text-xs btn-secondary py-1 px-2 flex items-center gap-1"
                                                                                    >
                                                                                        <Download size={12} />
                                                                                    </button>
                                                                                    {/* Reemplazar solo para items de archivo único */}
                                                                                    {!checkItem.allows_multiple_files && isUploader && item.status !== 'approved' && (
                                                                                        <>
                                                                                            <input type="file" id={`reupload-${item.id}`} className="hidden" accept=".pdf,.doc,.docx,.zip" onChange={(e) => handleFileUpload(e, item.id)} disabled={uploadingItemId === item.id} />
                                                                                            <label htmlFor={`reupload-${item.id}`} className="text-xs btn-secondary py-1 px-2 flex items-center gap-1 cursor-pointer text-blue-600 hover:bg-blue-50">
                                                                                                <RefreshCw size={12} /> Reemplazar
                                                                                            </label>
                                                                                        </>
                                                                                    )}
                                                                                    {/* Eliminar - para super_admin en cualquier caso, o para multi-archivo */}
                                                                                    {(isSuperAdmin || (checkItem.allows_multiple_files && isUploader)) && item.status !== 'approved' && (
                                                                                        <button
                                                                                            onClick={() => handleDeleteDocument(doc.id, doc.file_path, item.id)}
                                                                                            disabled={deletingDocId === doc.id}
                                                                                            className="text-xs btn-secondary py-1 px-2 flex items-center gap-1 text-red-600 hover:bg-red-50"
                                                                                            title="Eliminar"
                                                                                        >
                                                                                            <Trash2 size={12} />
                                                                                        </button>
                                                                                    )}
                                                                                    {/* Botón Analizar IA por archivo */}
                                                                                    {isSuperAdmin && (
                                                                                        <button
                                                                                            onClick={() => handleRunAI(doc.id)}
                                                                                            disabled={analyzingDocId === doc.id}
                                                                                            className="text-xs btn-secondary py-1 px-2 flex items-center gap-1 bg-purple-50 text-purple-700 hover:bg-purple-100"
                                                                                            title="Analizar este archivo con IA"
                                                                                        >
                                                                                            <Bot size={12} />
                                                                                            {analyzingDocId === doc.id ? 'Analizando…' : 'IA'}
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                                {/* Mostrar análisis Administrador del documento si existe */}
                                                                                {doc.ai_document_analyses && doc.ai_document_analyses.length > 0 && (
                                                                                    <div className="mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100">
                                                                                        <div className="flex items-center gap-1 text-xs text-purple-700 font-medium">
                                                                                            <Bot size={12} />
                                                                                            <span>Análisis Administrador</span>
                                                                                            <span className={`ml-auto px-1.5 py-0.5 rounded text-[10px] ${
                                                                                                doc.ai_document_analyses[0].status === 'approved' ? 'bg-green-100 text-green-700' :
                                                                                                doc.ai_document_analyses[0].status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                                                                                                'bg-red-100 text-red-700'
                                                                                            }`}>
                                                                                                {doc.ai_document_analyses[0].status}
                                                                                            </span>
                                                                                        </div>
                                                                                        {doc.ai_document_analyses[0].alerts?.slice(0, 2).map((alert: any, i: number) => (
                                                                                            <p key={i} className="text-[10px] text-gray-600 mt-1 truncate">
                                                                                                {alert.type === 'error' ? '❌' : alert.type === 'warning' ? '⚠️' : '✅'} {alert.message}
                                                                                            </p>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Bloque B: Estado del Requisito */}
                                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-center items-center text-center">
                                                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wide w-full text-left">{t('dossiers.detail.blockB')}</h4>

                                                                <div className={`
                                                                px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 mb-2
                                                                ${item.status === 'approved' ? 'bg-green-100 text-green-700' : ''}
                                                                ${item.status === 'observed' ? 'bg-red-100 text-red-700' : ''}
                                                                ${item.status === 'uploaded' ? 'bg-blue-100 text-blue-700' : ''}
                                                            `}>
                                                                    {item.status === 'approved' && <><CheckCircle2 size={18} /> {t('dossiers.detail.approved')}</>}
                                                                    {item.status === 'observed' && <><AlertCircle size={18} /> {t('dossiers.detail.observed')}</>}
                                                                    {item.status === 'uploaded' && <><Clock size={18} /> {t('dossiers.detail.reviewRequired')}</>}
                                                                </div>

                                                                {/* Mensaje detallado de estado / acción requerida */}
                                                                <p className={`text-sm font-medium ${item.status === 'observed' ? 'text-red-600' :
                                                                        item.status === 'uploaded' ? 'text-blue-600' :
                                                                            'text-green-600'
                                                                    }`}>
                                                                    {item.status === 'uploaded' && t('dossiers.detail.pendingReview')}
                                                                    {item.status === 'observed' && t('dossiers.detail.pendingCorrection')}
                                                                    {item.status === 'approved' && t('dossiers.detail.valid')}
                                                                </p>
                                                                <p className="text-xs text-gray-400 mt-2">Dictamen técnico oficial</p>
                                                            </div>

                                                            {/* Bloque C: Análisis Administrador */}
                                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden">
                                                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wide relative z-10">{t('dossiers.detail.blockC')}</h4>

                                                                {!currentDoc.ai_document_analyses?.length ? (
                                                                    <div className="text-center py-4 relative z-10">
                                                                        <p className="text-sm text-gray-400 mb-3">{t('ai.pendingAdmin')}</p>
                                                                        {isSuperAdmin && (
                                                                            <div className="flex flex-col gap-2">
                                                                                {/* Botón para analizar etapa completa (multi-archivo) */}
                                                                                {checkItem.allows_multiple_files && item.documents && item.documents.length > 1 && (
                                                                                    <button
                                                                                        onClick={() => handleRunAIForItem(item.id)}
                                                                                        disabled={analyzingItemId === item.id}
                                                                                        className="btn-primary text-xs bg-indigo-600 hover:bg-indigo-700 border-none disabled:opacity-50"
                                                                                    >
                                                                                        {analyzingItemId === item.id ? (
                                                                                            <span className="flex items-center justify-center"><RefreshCw className="animate-spin mr-1" size={14} /> Analizando {item.documents.length} archivos...</span>
                                                                                        ) : (
                                                                                            <span className="flex items-center justify-center"><Bot size={14} className="mr-1" /> Analizar Etapa ({item.documents.length} archivos)</span>
                                                                                        )}
                                                                                    </button>
                                                                                )}
                                                                                {/* Botón para analizar documento individual */}
                                                                                <button
                                                                                    onClick={() => handleRunAI(currentDoc.id)}
                                                                                    disabled={analyzingDocId === currentDoc.id}
                                                                                    className="btn-primary text-xs bg-purple-600 hover:bg-purple-700 border-none disabled:opacity-50"
                                                                                >
                                                                                    {analyzingDocId === currentDoc.id ? (
                                                                                        <span className="flex items-center justify-center"><RefreshCw className="animate-spin mr-1" size={14} /> Analizando...</span>
                                                                                    ) : (
                                                                                        <span className="flex items-center justify-center"><FileText size={14} className="mr-1" /> Analizar Doc Individual</span>
                                                                                    )}
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="relative z-10 space-y-3">
                                                                        {/* Header con estado y fecha */}
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${currentDoc.ai_document_analyses[0].analysis_json?.coincide_con_requisito
                                                                                    ? 'bg-green-100 text-green-700'
                                                                                    : 'bg-red-100 text-red-700'
                                                                                    }`}>
                                                                                    {currentDoc.ai_document_analyses[0].analysis_json?.coincide_con_requisito ? '✓ Válido' : '✗ Revisar'}
                                                                                </span>
                                                                                <span className="text-[10px] text-gray-400">
                                                                                    {new Date(currentDoc.ai_document_analyses[0].created_at).toLocaleString()}
                                                                                </span>
                                                                            </div>
                                                                            {isSuperAdmin && (
                                                                                <button
                                                                                    onClick={() => handleRunAI(currentDoc.id)}
                                                                                    disabled={analyzingDocId === currentDoc.id}
                                                                                    className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                                                                    title="Volver a ejecutar análisis"
                                                                                >
                                                                                    <RefreshCw size={10} className={analyzingDocId === currentDoc.id ? "animate-spin" : ""} /> Re-analizar
                                                                                </button>
                                                                            )}
                                                                        </div>

                                                                        {/* Conclusión principal */}
                                                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                                            <p className="text-sm text-gray-800 font-medium">
                                                                                {currentDoc.ai_document_analyses[0].analysis_json?.conclusion || 'Análisis completado'}
                                                                            </p>
                                                                            {currentDoc.ai_document_analyses[0].analysis_json?.tipo_detectado && (
                                                                                <p className="text-xs text-gray-500 mt-1">
                                                                                    <strong>Tipo detectado:</strong> {currentDoc.ai_document_analyses[0].analysis_json.tipo_detectado}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Observaciones/Alertas si existen */}
                                                                        {currentDoc.ai_document_analyses[0].analysis_json?.observaciones && (
                                                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                                                <p className="text-xs font-semibold text-amber-800 mb-1">📋 Observaciones:</p>
                                                                                <p className="text-xs text-amber-700">
                                                                                    {currentDoc.ai_document_analyses[0].analysis_json.observaciones}
                                                                                </p>
                                                                            </div>
                                                                        )}

                                                                        {/* Alertas del análisis */}
                                                                        {currentDoc.ai_document_analyses[0].alerts && currentDoc.ai_document_analyses[0].alerts.length > 0 && (
                                                                            <div className="space-y-1">
                                                                                {currentDoc.ai_document_analyses[0].alerts.map((alert: any, idx: number) => (
                                                                                    <div key={idx} className={`text-xs p-2 rounded flex items-start gap-2 ${alert.type === 'error' ? 'bg-red-50 text-red-700' :
                                                                                        alert.type === 'warning' ? 'bg-amber-50 text-amber-700' :
                                                                                            'bg-blue-50 text-blue-700'
                                                                                        }`}>
                                                                                        <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
                                                                                        {alert.message}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {/* Botón ver JSON completo */}
                                                                        <button
                                                                            onClick={() => setJsonModalData(currentDoc.ai_document_analyses?.[0]?.analysis_json || { empty: true })}
                                                                            className="text-xs text-purple-600 hover:underline flex items-center gap-1"
                                                                        >
                                                                            <Eye size={12} /> Ver análisis completo
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Bloque D: Dictamen Técnico */}
                                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
                                                                <h4 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wide">{t('dossiers.detail.blockD')}</h4>

                                                                {/* Historial rápido (Último dictamen) */}
                                                                {currentDoc.technical_reviews && currentDoc.technical_reviews.length > 0 && (() => {
                                                                    const review = currentDoc.technical_reviews[0];
                                                                    // Obtener el comentario en el idioma del usuario
                                                                    type LocaleKey = 'es' | 'en' | 'hi' | 'zh-CN';
                                                                    const currentLocale = locale as LocaleKey;
                                                                    const displayComment = review.comments_i18n
                                                                        ? (review.comments_i18n[currentLocale] || review.comments_i18n.es || review.comments_i18n.en || review.comments)
                                                                        : review.comments;
                                                                    const hasTranslation = review.comments_i18n && Object.keys(review.comments_i18n).length > 1;

                                                                    return (
                                                                        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-100">
                                                                            <div className="flex justify-between items-start">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${review.decision === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                                        {review.decision === 'approved' ? (locale === 'en' ? 'APPROVED' : 'APROBADO') : (locale === 'en' ? 'OBSERVED' : 'OBSERVADO')}
                                                                                    </span>
                                                                                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                                                                        v{review.version_reviewed || '?'}
                                                                                    </span>
                                                                                    {hasTranslation && (
                                                                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded flex items-center gap-1" title="Traducido automáticamente">
                                                                                            <Languages size={10} />
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <span className="text-[10px] text-gray-400">{new Date(review.created_at).toLocaleDateString()}</span>
                                                                            </div>
                                                                            <p className="text-sm text-gray-800 mt-2">{displayComment || (locale === 'en' ? 'No comments.' : 'Sin comentarios.')}</p>
                                                                        </div>
                                                                    );
                                                                })()}

                                                                {/* Formulario de Revisión (Solo si tengo permisos) */}
                                                                {isReviewer && (
                                                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                                                        <p className="text-sm font-medium mb-2">{locale === 'en' ? 'New Verdict:' : 'Nuevo Dictamen:'}</p>
                                                                        <div className="flex gap-4 mb-3">
                                                                            <label className="flex items-center cursor-pointer">
                                                                                <input type="radio" name={`decision-${item.id}`} className="mr-2" onChange={() => setReviewDecision('approved')} checked={reviewDecision === 'approved'} />
                                                                                <span className="text-sm">{locale === 'en' ? 'Approve' : 'Aprobar'}</span>
                                                                            </label>
                                                                            <label className="flex items-center cursor-pointer">
                                                                                <input type="radio" name={`decision-${item.id}`} className="mr-2" onChange={() => setReviewDecision('observed')} checked={reviewDecision === 'observed'} />
                                                                                <span className="text-sm">{locale === 'en' ? 'Observe' : 'Observar'}</span>
                                                                            </label>
                                                                        </div>

                                                                        {reviewDecision === 'observed' && (
                                                                            <textarea
                                                                                className="input w-full text-sm min-h-[80px] mb-3"
                                                                                placeholder={locale === 'en' ? 'Write mandatory observations...' : 'Escriba las observaciones obligatorias...'}
                                                                                value={reviewComment}
                                                                                onChange={(e) => setReviewComment(e.target.value)}
                                                                            />
                                                                        )}

                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                                <Languages size={10} />
                                                                                {t('dossiers.detail.autoTranslated')}
                                                                            </span>
                                                                            <button
                                                                                disabled={!reviewDecision || (reviewDecision === 'observed' && !reviewComment) || savingReview}
                                                                                onClick={() => handleSubmitReview(item.id, currentDoc.id)}
                                                                                className="btn-primary text-xs flex items-center gap-1"
                                                                            >
                                                                                {savingReview ? (
                                                                                    <>
                                                                                        <RefreshCw size={12} className="animate-spin" />
                                                                                        {locale === 'en' ? 'Saving & Translating...' : 'Guardando y traduciendo...'}
                                                                                    </>
                                                                                ) : (
                                                                                    locale === 'en' ? 'Save Verdict' : 'Guardar Dictamen'
                                                                                )}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal para ver JSON */}
            {jsonModalData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 transition-opacity animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={18} className="text-purple-600" />
                                {t('ai.detailTitle')}
                            </h3>
                            <button onClick={() => setJsonModalData(null)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4 overflow-auto bg-white relative flex-1">
                            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {formatAnalysisToText(jsonModalData, t)}
                            </div>
                        </div>
                        <div className="p-3 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setJsonModalData(null)}
                                className="btn-primary py-1.5 px-4 text-sm"
                            >
                                {t('ai.close')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
