'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Lab {
    id: string;
    name: string;
    ruc: string;
    country: string;
    status: string;
    created_at: string;
}

interface Props {
    initialLabs: Lab[];
}

export default function LabsClient({ initialLabs }: Props) {
    const t = useTranslations();
    const router = useRouter();
    const [labs, setLabs] = useState<Lab[]>(initialLabs);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        ruc: '',
        country: '',
        status: 'active'
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const loadLabs = async () => {
        const supabase = createClient();
        const { data } = await supabase
            .from('labs')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setLabs(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const supabase = createClient();

        try {
            if (editingId) {
                const { error } = await supabase
                    .from('labs')
                    .update(formData)
                    .eq('id', editingId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('labs')
                    .insert([formData]);

                if (error) throw error;
            }

            // Recargar datos
            await loadLabs();
            setShowForm(false);
            setFormData({ name: '', ruc: '', country: '', status: 'active' });
            setEditingId(null);
            alert(editingId ? 'Laboratorio actualizado' : 'Laboratorio creado');
        } catch (error: any) {
            alert('Error: ' + (error.message || 'Error al guardar'));
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (lab: Lab) => {
        setFormData({
            name: lab.name,
            ruc: lab.ruc || '',
            country: lab.country || '',
            status: lab.status
        });
        setEditingId(lab.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este laboratorio?')) return;

        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.from('labs').delete().eq('id', id);

        if (error) {
            alert('Error al eliminar: ' + error.message);
            console.error('Delete error:', error);
        } else {
            await loadLabs();
            alert('Laboratorio eliminado');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('config.labs.title')}</h1>
                    <p className="text-gray-600 mt-1">{t('config.labs.description')}</p>
                </div>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditingId(null);
                        setFormData({ name: '', ruc: '', country: '', status: 'active' });
                    }}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>{t('config.labs.create')}</span>
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-6">
                            {editingId ? t('config.labs.edit') : t('config.labs.create')}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="label">{t('config.labs.name')} *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">{t('config.labs.ruc')}</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.ruc}
                                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">País</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="label">{t('config.labs.status')}</label>
                                <select
                                    className="input"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">{t('status.active')}</option>
                                    <option value="inactive">{t('status.inactive')}</option>
                                </select>
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
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingId(null);
                                        setFormData({ name: '', ruc: '', country: '', status: 'active' });
                                    }}
                                    className="btn-secondary flex-1"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Labs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Laboratorio</th>
                            <th>RUC</th>
                            <th>País</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {labs.map((lab) => (
                            <tr key={lab.id}>
                                <td>
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <Building2 size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{lab.name}</div>
                                            <div className="text-xs text-gray-500">{lab.id.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{lab.ruc || '-'}</td>
                                <td>{lab.country || '-'}</td>
                                <td>
                                    <span className={`badge ${lab.status === 'active' ? 'badge-success' : 'badge-gray'}`}>
                                        {lab.status === 'active' ? t('status.active') : t('status.inactive')}
                                    </span>
                                </td>
                                <td className="text-sm text-gray-600">
                                    {new Date(lab.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleEdit(lab)}
                                            className="p-2 hover:bg-gray-100 rounded"
                                            title="Editar"
                                        >
                                            <Edit size={16} className="text-blue-600" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(lab.id)}
                                            className="p-2 hover:bg-gray-100 rounded"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} className="text-red-600" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {labs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No hay laboratorios registrados
                    </div>
                )}
            </div>
        </div>
    );
}
