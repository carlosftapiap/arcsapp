'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Plus, Package, Edit, FolderOpen, Trash2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Product {
    id: string;
    product_type: string;
    nombre_comercial: string;
    principio_activo?: string;
    forma_farmaceutica?: string;
    concentracion?: string;
    via_administracion?: string;
    presentacion?: string;
    origen: string;
    fabricante?: string;
    titular?: string;
    pais_origen?: string;
    lab_id: string;
    created_at: string;
}

interface Lab {
    id: string;
    name: string;
}

interface Props {
    initialProducts: Product[];
    availableLabs: Lab[];
    initialLabId: string;
}

export default function ProductsClient({ initialProducts, availableLabs, initialLabId }: Props) {
    const t = useTranslations();
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [currentLabId, setCurrentLabId] = useState<string>(initialLabId);

    // Formulario
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        lab_id: initialLabId,
        product_type: 'medicine_general',
        nombre_comercial: '',
        principio_activo: '',
        forma_farmaceutica: '',
        concentracion: '',
        via_administracion: '',
        presentacion: '',
        origen: 'imported',
        fabricante: '',
        titular: '',
        pais_origen: ''
    });

    const loadProducts = async () => {
        const supabase = createClient();
        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        // Si hay un lab seleccionado, filtrar. Si es "all", mostrar todos.
        // Por ahora forzamos selección de lab, o "all" si se implementa vista global.
        if (currentLabId !== 'all') {
            query = query.eq('lab_id', currentLabId);
        }

        const { data } = await query;
        if (data) setProducts(data);
    };

    const handleLabChange = async (labId: string) => {
        setCurrentLabId(labId);
        // Recargar productos al cambiar de lab
        const supabase = createClient();
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('lab_id', labId)
            .order('created_at', { ascending: false });

        if (data) setProducts(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('products')
                    .update(formData)
                    .eq('id', editingId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('products')
                    .insert([formData]);

                if (error) throw error;
            }

            // Recargar datos (usando el lab del producto guardado para verlo)
            if (formData.lab_id !== currentLabId) {
                setCurrentLabId(formData.lab_id);
            }
            // Pequeño timeout para asegurar que el insert se procesó
            setTimeout(async () => {
                const { data } = await supabase
                    .from('products')
                    .select('*')
                    .eq('lab_id', formData.lab_id)
                    .order('created_at', { ascending: false });
                if (data) setProducts(data);
            }, 500);

            setShowForm(false);
            resetForm();
            alert(editingId ? 'Producto actualizado' : 'Producto creado');
        } catch (error: any) {
            alert('Error: ' + (error.message || 'Error al guardar'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        setLoading(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (error) throw error;

            await loadProducts();
            alert('Producto eliminado');
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: Product) => {
        setFormData({
            lab_id: product.lab_id,
            product_type: product.product_type,
            nombre_comercial: product.nombre_comercial,
            principio_activo: product.principio_activo || '',
            forma_farmaceutica: product.forma_farmaceutica || '',
            concentracion: product.concentracion || '',
            via_administracion: product.via_administracion || '',
            presentacion: product.presentacion || '',
            origen: product.origen,
            fabricante: product.fabricante || '',
            titular: product.titular || '',
            pais_origen: product.pais_origen || ''
        });
        setEditingId(product.id);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({
            lab_id: currentLabId,
            product_type: 'medicine_general',
            nombre_comercial: '',
            principio_activo: '',
            forma_farmaceutica: '',
            concentracion: '',
            via_administracion: '',
            presentacion: '',
            origen: 'imported',
            fabricante: '',
            titular: '',
            pais_origen: ''
        });
        setEditingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('products.title')}</h1>
                    <div className="flex items-center mt-2 space-x-2">
                        <span className="text-gray-600">Ver productos de:</span>
                        <select
                            className="form-select text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            value={currentLabId}
                            onChange={(e) => handleLabChange(e.target.value)}
                        >
                            {availableLabs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>{t('products.create')}</span>
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-8 max-w-2xl w-full my-8">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingId ? 'Editar Producto' : t('products.create')}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Selector de Laboratorio en Formulario */}
                            <div>
                                <label className="label">Laboratorio *</label>
                                <select
                                    className="input"
                                    value={formData.lab_id}
                                    onChange={(e) => setFormData({ ...formData, lab_id: e.target.value })}
                                    required
                                >
                                    {availableLabs.map(lab => (
                                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('dossiers.productType')}</label>
                                    <select
                                        className="input"
                                        value={formData.product_type}
                                        onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                                        disabled={!!editingId} // Tipo no editable
                                    >
                                        <option value="medicine_general">{t('productTypes.medicine_general')}</option>
                                        <option value="biologic">{t('productTypes.biologic')}</option>
                                        <option value="device_medical">{t('productTypes.device_medical')}</option>
                                        <option value="supplement_food">{t('productTypes.supplement_food') || 'Suplemento Alimenticio'}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="label">{t('dossiers.origin')}</label>
                                    <select
                                        className="input"
                                        value={formData.origen}
                                        onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                                    >
                                        <option value="imported">{t('origin.imported')}</option>
                                        <option value="national">{t('origin.national')}</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label">{t('products.nombreComercial')} *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.nombre_comercial}
                                    onChange={(e) => setFormData({ ...formData, nombre_comercial: e.target.value })}
                                    required
                                />
                            </div>

                            {formData.product_type === 'medicine_general' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">{t('products.principioActivo')}</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={formData.principio_activo}
                                                onChange={(e) => setFormData({ ...formData, principio_activo: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="label">{t('products.formaFarmaceutica')}</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={formData.forma_farmaceutica}
                                                onChange={(e) => setFormData({ ...formData, forma_farmaceutica: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">{t('products.concentracion')}</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={formData.concentracion}
                                                onChange={(e) => setFormData({ ...formData, concentracion: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="label">{t('products.viaAdministracion')}</label>
                                            <input
                                                type="text"
                                                className="input"
                                                value={formData.via_administracion}
                                                onChange={(e) => setFormData({ ...formData, via_administracion: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="label">{t('products.presentacion')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.presentacion}
                                    onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })}
                                    placeholder="Ej: Caja x 30 tabletas"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">{t('products.fabricante')}</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.fabricante}
                                        onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="label">{t('products.paisOrigen')}</label>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.pais_origen}
                                        onChange={(e) => setFormData({ ...formData, pais_origen: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Guardando...' : t('common.save')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="btn-secondary flex-1"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                    <div key={product.id} className="card hover-lift group relative">
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleEdit(product); }}
                                className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-blue-600"
                                title="Editar"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                                className="p-1 bg-white rounded-full shadow hover:bg-gray-100 text-red-600"
                                title="Eliminar"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <div className="flex items-start space-x-4">
                            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package size={24} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 truncate pr-8">
                                    {product.nombre_comercial}
                                </h3>
                                <p className="text-sm text-gray-600 truncate">
                                    {product.principio_activo || product.fabricante}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <span className="badge badge-info text-xs">
                                        {t(`productTypes.${product.product_type}`)}
                                    </span>
                                    <span className="badge badge-gray text-xs">
                                        {t(`origin.${product.origen}`)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                            <div className="flex justify-between items-center">
                                <span>{product.fabricante || '-'}</span>
                                {/* Mostrar nombre del lab si está disponible en future (requiere join en query) */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg">
                    <Package size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 mb-4">No hay productos en este laboratorio</p>
                    <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
                        {t('products.create')}
                    </button>
                </div>
            )}
        </div>
    );
}
