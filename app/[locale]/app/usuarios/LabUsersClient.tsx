'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Users, UserPlus, Trash2, Shield, Building2, UserCog, Mail, Lock, User } from 'lucide-react';
import { useLocale } from 'next-intl';
import { createUser } from './actions';

interface LabMember {
    user_id: string;
    role: string;
    profile: {
        email: string;
        full_name: string;
        avatar_url?: string;
    };
}

interface Lab {
    id: string;
    name: string;
}

interface Props {
    availableLabs: Lab[];
    initialLabId: string;
}

export default function LabUsersClient({ availableLabs, initialLabId }: Props) {
    const locale = useLocale();
    const [currentLabId, setCurrentLabId] = useState(initialLabId);
    const [members, setMembers] = useState<LabMember[]>([]);
    const [loading, setLoading] = useState(false);

    // Invite Modal State
    const [showInviteModal, setShowInviteModal] = useState(false);
    // UI States for Create User
    const [createName, setCreateName] = useState('');
    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createRole, setCreateRole] = useState('lab_viewer');
    const [creating, setCreating] = useState(false);

    // Initial load & Reload on lab change
    useEffect(() => {
        loadMembers(currentLabId);
    }, [currentLabId]);

    const loadMembers = async (labId: string) => {
        setLoading(true);
        const supabase = createClient();

        try {
            // Nota: Esta query asume que existe la relación profiles en la DB
            // Si profiles no es una tabla foreign key directa, habrá que ajustarlo.
            // Asumimos view o join manual.

            // Usaremos una join manual segura obteniendo data de profiles via user_id
            const { data: rawMembers, error } = await supabase
                .from('lab_members')
                .select(`
                    user_id,
                    role
                `)
                .eq('lab_id', labId);

            if (error) throw error;

            // Enriquecer con profiles (email, name)
            // Necesitamos buscar los profiles de estos user_ids
            if (rawMembers && rawMembers.length > 0) {
                const userIds = rawMembers.map(m => m.user_id);
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, email, full_name, avatar_url')
                    .in('id', userIds);

                const membersWithProfiles = rawMembers.map(member => ({
                    ...member,
                    profile: profiles?.find(p => p.id === member.user_id) || { email: 'Unknown', full_name: 'Unknown User' }
                }));

                setMembers(membersWithProfiles as LabMember[]);
            } else {
                setMembers([]);
            }

        } catch (error) {
            console.error('Error cargando miembros:', error);
            alert('Error al cargar la lista de miembros.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        const formData = new FormData();
        formData.append('fullName', createName);
        formData.append('email', createEmail);
        formData.append('password', createPassword);
        formData.append('labId', currentLabId);
        formData.append('role', createRole);

        try {
            const result = await createUser(formData);

            if (result.error) {
                alert("Error al crear usuario: " + result.error);
            } else {
                alert("¡Usuario creado exitosamente!");
                setShowInviteModal(false);
                setCreateName('');
                setCreateEmail('');
                setCreatePassword('');
                loadMembers(currentLabId);
            }
        } catch (error) {
            console.error(error);
            alert("Error desconocido al crear usuario.");
        } finally {
            setCreating(false);
        }
    };


    const handleRemoveMember = async (userId: string) => {
        if (!confirm("¿Seguro que quieres eliminar a este usuario del laboratorio?")) return;

        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('lab_members')
                .delete()
                .eq('lab_id', currentLabId)
                .eq('user_id', userId);

            if (error) throw error;

            // Optimistic update
            setMembers(members.filter(m => m.user_id !== userId));

        } catch (error: any) {
            alert("Error eliminando usuario: " + error.message);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        const supabase = createClient();
        try {
            const { error } = await supabase
                .from('lab_members')
                .update({ role: newRole })
                .eq('lab_id', currentLabId)
                .eq('user_id', userId);

            if (error) throw error;

            // Update local state
            setMembers(members.map(m => m.user_id === userId ? { ...m, role: newRole } : m));

        } catch (error: any) {
            alert("Error actualizando rol: " + error.message);
        }
    };

    const roleLabels: Record<string, string> = {
        'lab_admin': 'Administrador',
        'lab_uploader': 'Editor (Uploader)',
        'lab_viewer': 'Lector (Viewer)',
        'super_admin': 'Super Admin'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Users className="mr-3 text-blue-600" />
                        Equipo del Laboratorio
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Gestiona los accesos y roles de los miembros de tu laboratorio.
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
                            className="input pl-9 pr-8 py-2 min-w-[200px]"
                            disabled={loading}
                        >
                            {availableLabs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="btn-primary flex items-center space-x-2"
                    >
                        <UserPlus size={18} />
                        <span>Invitar Miembro</span>
                    </button>
                </div>
            </div>

            {/* Members List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    Cargando miembros...
                                </td>
                            </tr>
                        ) : members.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                    No hay miembros en este laboratorio (aparte de ti).
                                </td>
                            </tr>
                        ) : (
                            members.map((member) => (
                                <tr key={member.user_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {member.profile.full_name?.[0]?.toUpperCase() || member.profile.email[0].toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{member.profile.full_name || 'Sin Nombre'}</div>
                                                <div className="text-sm text-gray-500">{member.profile.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            value={member.role}
                                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                                            disabled={member.role === 'super_admin'}
                                        >
                                            <option value="lab_admin">Administrador de Lab</option>
                                            <option value="lab_uploader">Editor (Uploader)</option>
                                            <option value="lab_viewer">Lector (Viewer)</option>
                                            {member.role === 'super_admin' && <option value="super_admin">Super Admin</option>}
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleRemoveMember(member.user_id)}
                                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-full transition-colors"
                                            title="Eliminar usuario"
                                            disabled={member.role === 'super_admin'}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center mb-4 text-gray-800">
                            <UserPlus className="mr-2 text-blue-600" size={24} />
                            <h2 className="text-xl font-bold">Crear Nuevo Usuario</h2>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre Completo
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        required
                                        className="input pl-10 w-full"
                                        placeholder="Juan Pérez"
                                        value={createName}
                                        onChange={(e) => setCreateName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        className="input pl-10 w-full"
                                        placeholder="usuario@ejemplo.com"
                                        value={createEmail}
                                        onChange={(e) => setCreateEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className="input pl-10 w-full"
                                        placeholder="******"
                                        value={createPassword}
                                        onChange={(e) => setCreatePassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rol en el Laboratorio
                                </label>
                                <div className="relative">
                                    <UserCog className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                    <select
                                        className="input pl-10 w-full"
                                        value={createRole}
                                        onChange={(e) => setCreateRole(e.target.value)}
                                    >
                                        <option value="lab_uploader">Editor (Uploader)</option>
                                        <option value="lab_viewer">Lector (Viewer)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        * Para crear Administradores, contacte al Super Admin.
                                    </p>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-4 border-t mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating || !createEmail || !createPassword}
                                    className="btn-primary flex-1"
                                >
                                    {creating ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
