'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus, Users as UsersIcon, Lock, User, Mail, Building2, UserCog, UserPlus, Edit, Trash2 } from 'lucide-react';
import { createUser, updateUserRole, deleteUser } from '@/app/[locale]/app/usuarios/actions';

interface Lab {
    id: string;
    name: string;
}

interface Profile {
    user_id: string;
    full_name: string;
    email: string;
    locale: string;
    created_at: string;
    lab_members: Array<{
        lab_id: string;
        role: string;
        labs: { name: string };
    }>;
}

interface Props {
    initialProfiles: Profile[];
    labs: Lab[];
}

export default function UsersClient({ initialProfiles, labs }: Props) {
    const t = useTranslations();

    // UI States
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);

    // Edit States
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingUser, setEditingUser] = useState<Profile | null>(null);
    const [editRole, setEditRole] = useState('');
    const [editLabId, setEditLabId] = useState('');
    const [saving, setSaving] = useState(false);

    // Form States
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [userType, setUserType] = useState('internal'); // internal, external_reviewer, global_admin
    const [selectedLabId, setSelectedLabId] = useState(labs[0]?.id || '');
    const [createRole, setCreateRole] = useState('lab_viewer');

    // Update role when userType changes
    const handleUserTypeChange = (type: string) => {
        setUserType(type);
        if (type === 'internal') {
            setCreateRole('lab_viewer');
            if (!selectedLabId && labs.length > 0) setSelectedLabId(labs[0].id);
        } else if (type === 'external_reviewer') {
            setCreateRole('reviewer');
            setSelectedLabId('');
        } else if (type === 'global_admin') {
            setCreateRole('super_admin');
            setSelectedLabId('');
        }
    };

    // Open edit modal
    const handleEditClick = (profile: Profile) => {
        setEditingUser(profile);
        setEditRole(profile.lab_members?.[0]?.role || 'lab_viewer');
        setEditLabId(profile.lab_members?.[0]?.lab_id || '');
        setShowEditForm(true);
    };

    // Save edit
    const handleSaveEdit = async () => {
        if (!editingUser) return;
        setSaving(true);

        try {
            const result = await updateUserRole(editingUser.user_id, editRole, editLabId || undefined);
            if (result.error) {
                alert("Error al actualizar: " + result.error);
            } else {
                alert("Usuario actualizado correctamente");
                setShowEditForm(false);
                window.location.reload();
            }
        } catch (error) {
            alert("Error inesperado al actualizar usuario");
        } finally {
            setSaving(false);
        }
    };

    // Delete user
    const handleDeleteClick = async (profile: Profile) => {
        if (!confirm(`¿Estás seguro de eliminar a ${profile.full_name}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const result = await deleteUser(profile.user_id);
            if (result.error) {
                alert("Error al eliminar: " + result.error);
            } else {
                alert("Usuario eliminado correctamente");
                window.location.reload();
            }
        } catch (error) {
            alert("Error inesperado al eliminar usuario");
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        const formData = new FormData();
        formData.append('fullName', createName);
        formData.append('email', createEmail);
        formData.append('password', createPassword);
        formData.append('labId', selectedLabId);
        formData.append('role', createRole);

        try {
            const result = await createUser(formData);

            if (result.error) {
                alert("Error al crear usuario: " + result.error);
            } else {
                alert("¡Usuario creado exitosamente!");
                // Reset form
                setShowForm(false);
                setCreateName('');
                setCreateEmail('');
                setCreatePassword('');
                // Aquí lo ideal sería recargar la página para ver el nuevo usuario
                window.location.reload();
            }
        } catch (error) {
            console.error(error);
            alert("Error desconocido al crear usuario.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t('config.users.title')}</h1>
                    <p className="text-gray-600 mt-1">{t('config.users.description')}</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="btn-primary flex items-center space-x-2"
                >
                    <Plus size={20} />
                    <span>{t('config.users.create')}</span>
                </button>
            </div>

            {/* Remove Info Box - Now we have a real form */}

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Email</th>
                            <th>Laboratorio</th>
                            <th>Rol</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {initialProfiles.map((profile) => (
                            <tr key={profile.user_id}>
                                <td>
                                    <div className="flex items-center space-x-3">
                                        <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                            <UsersIcon size={20} className="text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{profile.full_name}</div>
                                            <div className="text-xs text-gray-500">{profile.user_id.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td>{profile.email}</td>
                                <td>
                                    {/* Si es Super Admin, es Global. Si no, mostramos su lab */}
                                    {profile.lab_members?.[0]?.role === 'super_admin' ? (
                                        <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded border border-purple-100">
                                            Global System
                                        </span>
                                    ) : (
                                        profile.lab_members?.[0]?.labs?.name || <span className="text-gray-400">Sin asignar</span>
                                    )}
                                </td>
                                <td>
                                    {profile.lab_members && profile.lab_members.length > 0 ? (
                                        <span className="badge badge-info">
                                            {t(`roles.${profile.lab_members[0].role}`)}
                                        </span>
                                    ) : (
                                        <span className="badge badge-gray">-</span>
                                    )}
                                </td>
                                <td className="text-sm text-gray-600">
                                    {new Date(profile.created_at).toLocaleDateString('es-ES')}
                                </td>
                                <td>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEditClick(profile)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar usuario"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(profile)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {initialProfiles.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No hay usuarios registrados
                    </div>
                )}
            </div>

            {/* CREATE USER MODAL */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center mb-6 text-gray-800">
                            <UserPlus className="mr-2 text-blue-600" size={24} />
                            <h2 className="text-xl font-bold">Registro Global de Usuario</h2>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-5">
                            {/* Datos Básicos */}
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                                    <input type="text" required className="input w-full" placeholder="Nombre y Apellido" value={createName} onChange={(e) => setCreateName(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                                    <input type="email" required className="input w-full" placeholder="usuario@dominio.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña Temporal</label>
                                    <input type="text" required minLength={6} className="input w-full" placeholder="******" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
                                </div>
                            </div>

                            <hr className="border-gray-100" />

                            {/* 1. Tipo de Usuario */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Tipo de Usuario</label>
                                <div className="space-y-2">
                                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${userType === 'internal' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="userType" value="internal" checked={userType === 'internal'} onChange={(e) => handleUserTypeChange(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-gray-900">Usuario del Laboratorio</span>
                                            <span className="block text-xs text-gray-500">Pertenece a una empresa específica (Admin, Editor, Lector)</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${userType === 'external_reviewer' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="userType" value="external_reviewer" checked={userType === 'external_reviewer'} onChange={(e) => handleUserTypeChange(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-gray-900">Revisor Externo</span>
                                            <span className="block text-xs text-gray-500">Consultor técnico que revisa múltiples laboratorios</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${userType === 'global_admin' ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="radio" name="userType" value="global_admin" checked={userType === 'global_admin'} onChange={(e) => handleUserTypeChange(e.target.value)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" />
                                        <div className="ml-3">
                                            <span className="block text-sm font-medium text-gray-900">Administrador Global</span>
                                            <span className="block text-xs text-gray-500">Gestión total de la plataforma</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* 2. Configuración Dinámica */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-1">
                                {userType === 'internal' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Laboratorio</label>
                                            <select className="input w-full" value={selectedLabId} onChange={(e) => setSelectedLabId(e.target.value)} required>
                                                <option value="">-- Seleccionar --</option>
                                                {labs.map(lab => (<option key={lab.id} value={lab.id}>{lab.name}</option>))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                            <select className="input w-full" value={createRole} onChange={(e) => setCreateRole(e.target.value)}>
                                                <option value="lab_admin">Administrador de Laboratorio</option>
                                                <option value="lab_uploader">Editor (Uploader)</option>
                                                <option value="lab_viewer">Lector (Viewer)</option>
                                            </select>
                                        </div>
                                    </>
                                )}

                                {userType === 'external_reviewer' && (
                                    <div className="md:col-span-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-800 border border-blue-100 flex items-center">
                                        <UserCog size={18} className="mr-2" />
                                        <span>Se creará con rol <strong>Revisor Técnico</strong>. Podrás asignarle laboratorios posteriormente.</span>
                                    </div>
                                )}

                                {userType === 'global_admin' && (
                                    <div className="md:col-span-2 p-3 bg-purple-50 rounded-lg text-sm text-purple-800 border border-purple-100 flex items-center">
                                        <Lock size={18} className="mr-2" />
                                        <span>Se creará con rol <strong>Super Admin Global</strong> con acceso total.</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button type="submit" disabled={creating || !createEmail || (userType === 'internal' && !selectedLabId)} className="btn-primary flex-1">
                                    {creating ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT USER MODAL */}
            {showEditForm && editingUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <UserCog className="text-blue-600" size={24} />
                                Editar Usuario
                            </h2>
                            <button onClick={() => setShowEditForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        <div className="p-6 space-y-6">

                            {/* Read Only Info */}
                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                    <User size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{editingUser.full_name}</h3>
                                    <p className="text-sm text-gray-600">{editingUser.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">ID: {editingUser.user_id}</p>
                                </div>
                            </div>

                            {/* Lab Selection (Only if current role is not super_admin or we want to allow changing it) */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Laboratorio</label>
                                <div className="relative">
                                    <select
                                        className="input w-full pl-10 appearance-none bg-white"
                                        value={editLabId}
                                        onChange={(e) => setEditLabId(e.target.value)}
                                        disabled={editRole === 'super_admin'}
                                    >
                                        <option value="">Sin Laboratorio (Global)</option>
                                        {labs.map(lab => (
                                            <option key={lab.id} value={lab.id}>{lab.name}</option>
                                        ))}
                                    </select>
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">El laboratorio al que pertenece el usuario.</p>
                            </div>

                            {/* Role Selection */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Rol del Usuario</label>
                                <select
                                    className="input w-full"
                                    value={editRole}
                                    onChange={(e) => {
                                        setEditRole(e.target.value);
                                        if (e.target.value === 'super_admin') setEditLabId('');
                                    }}
                                >
                                    <optgroup label="Laboratorio">
                                        <option value="lab_admin">Administrador de Laboratorio</option>
                                        <option value="lab_uploader">Editor (Uploader)</option>
                                        <option value="lab_viewer">Lector (Viewer)</option>
                                    </optgroup>
                                    <optgroup label="Externos">
                                        <option value="reviewer">Revisor Externo (Reviewer)</option>
                                    </optgroup>
                                    <optgroup label="Sistema">
                                        <option value="super_admin">Super Administrador</option>
                                    </optgroup>
                                </select>
                                <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                                    {editRole === 'lab_admin' && "Tiene acceso total a los datos de su laboratorio."}
                                    {editRole === 'lab_uploader' && "Puede subir documentos y ver reportes de su laboratorio."}
                                    {editRole === 'lab_viewer' && "Solo puede ver datos de su laboratorio, sin permisos de edición."}
                                    {editRole === 'reviewer' && "Puede revisar y aprobar documentos de múltiples laboratorios asignados."}
                                    {editRole === 'super_admin' && "Tiene control total sobre toda la plataforma."}
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowEditForm(false)} className="btn-secondary flex-1">Cancelar</button>
                                <button
                                    type="button"
                                    onClick={handleSaveEdit}
                                    disabled={saving}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
