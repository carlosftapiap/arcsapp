'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: string;
    nombre_comercial: string;
    product_type: string;
    origen: string;
}

interface ChecklistTemplate {
    id: string;
    product_type: string;
    name: string;
    version: number;
}

export default function NuevoDossierPage() {
    const t = useTranslations();
    const router = useRouter();
    const searchParams = useSearchParams();
    const productId = searchParams?.get('product');

    const [products, setProducts] = useState<Product[]>([]);
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        product_id: productId || '',
        template_id: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (formData.product_id) {
            const product = products.find(p => p.id === formData.product_id);
            if (product) {
                loadTemplates(product.product_type);
            }
        }
    }, [formData.product_id, products]);

    const loadData = async () => {
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: labMember } = await supabase
            .from('lab_members')
            .select('lab_id')
            .eq('user_id', user.id)
            .single();

        if (!labMember) return;

        // Load products
        const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('lab_id', labMember.lab_id)
            .order('nombre_comercial');

        if (productsData) setProducts(productsData);
        setLoading(false);
    };

    const loadTemplates = async (productType: string) => {
        const supabase = createClient();

        const { data } = await supabase
            .from('checklist_templates')
            .select('*')
            .eq('product_type', productType)
            .eq('active', true)
            .order('version', { ascending: false });

        if (data) {
            setTemplates(data);
            // Auto-select the first template
            if (data.length > 0) {
                setFormData(prev => ({ ...prev, template_id: data[0].id }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: labMember } = await supabase
            .from('lab_members')
            .select('lab_id')
            .eq('user_id', user.id)
            .single();

        if (!labMember) return;

        // Get product details
        const product = products.find(p => p.id === formData.product_id);
        if (!product) return;

        // Create dossier
        const { data: dossier, error: dossierError } = await supabase
            .from('dossiers')
            .insert([{
                lab_id: labMember.lab_id,
                product_id: formData.product_id,
                product_type: product.product_type,
                product_name: product.nombre_comercial,
                origin: product.origen,
                status: 'draft',
                created_by: user.id
            }])
            .select()
            .single();

        if (dossierError || !dossier) {
            alert('Error al crear el dossier');
            setCreating(false);
            return;
        }

        // Get checklist items from template
        const { data: items } = await supabase
            .from('checklist_items')
            .select('*')
            .eq('template_id', formData.template_id)
            .order('sort_order');

        if (items) {
            // Create dossier_items from template
            const dossierItems = items.map(item => ({
                dossier_id: dossier.id,
                checklist_item_id: item.id,
                status: 'pending'
            }));

            await supabase
                .from('dossier_items')
                .insert(dossierItems);
        }

        // Navigate to dossier detail
        router.push(`/app/dossiers/${dossier.id}`);
    };

    const selectedProduct = products.find(p => p.id === formData.product_id);

    if (loading) {
        return <div className="flex items-center justify-center h-64">
            <div className="spinner"></div>
        </div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-4">
                <Link href="/app/dossiers" className="p-2 hover:bg-gray-100 rounded-lg">
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('dossiers.create')}</h1>
                    <p className="text-gray-600 mt-1">Selecciona un producto y plantilla</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Product Selection */}
                    <div>
                        <label className="label">{t('products.selectProduct')} *</label>
                        <select
                            className="input"
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value, template_id: '' })}
                            required
                        >
                            <option value="">-- Seleccionar producto --</option>
                            {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.nombre_comercial} ({t(`productTypes.${product.product_type}`)})
                                </option>
                            ))}
                        </select>
                        {products.length === 0 && (
                            <p className="text-sm text-gray-500 mt-2">
                                No hay productos disponibles.{' '}
                                <Link href="/app/productos" className="text-blue-600 hover:underline">
                                    Crear producto
                                </Link>
                            </p>
                        )}
                    </div>

                    {/* Selected Product Preview */}
                    {selectedProduct && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start space-x-3">
                                <div className="h-10 w-10 bg-gradient-blue rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Package size={20} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{selectedProduct.nombre_comercial}</h3>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <span className="badge badge-info text-xs">
                                            {t(`productTypes.${selectedProduct.product_type}`)}
                                        </span>
                                        <span className="badge badge-gray text-xs">
                                            {t(`origin.${selectedProduct.origen}`)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Template Selection */}
                    {templates.length > 0 && (
                        <div>
                            <label className="label">Plantilla de Checklist *</label>
                            <select
                                className="input"
                                value={formData.template_id}
                                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                                required
                            >
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name} (v{template.version})
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-gray-500 mt-1">
                                La plantilla define qué documentos debes subir
                            </p>
                        </div>
                    )}

                    {formData.product_id && templates.length === 0 && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                                No hay plantillas activas para este tipo de producto.
                                Contacta al administrador.
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="submit"
                            disabled={creating || !formData.product_id || !formData.template_id}
                            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {creating ? (
                                <span className="flex items-center justify-center">
                                    <div className="spinner mr-2"></div>
                                    Creando...
                                </span>
                            ) : (
                                t('common.create')
                            )}
                        </button>
                        <Link href="/app/dossiers" className="btn-secondary flex-1 text-center">
                            {t('common.cancel')}
                        </Link>
                    </div>
                </form>
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">ℹ️ ¿Qué sucede al crear un dossier?</h3>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                    <li>Se crea un expediente nuevo vinculado al producto</li>
                    <li>Se copian todos los ítems de la plantilla seleccionada</li>
                    <li>El estado inicial será "Borrador"</li>
                    <li>Podrás comenzar a subir documentos inmediatamente</li>
                </ul>
            </div>
        </div>
    );
}
