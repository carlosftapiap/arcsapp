'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, Users } from 'lucide-react';
import {
    getAssignmentsForDossier,
    getTecnicosAvailable,
    assignTechnicianToDossier,
    unassignTechnicianFromDossier,
} from '@/app/[locale]/app/dossiers/actions/assignments';

interface AssignedUser {
    id: string;
    user_id: string;
    assigned_at: string;
    profiles: { full_name: string; email: string };
}

interface AvailableUser {
    user_id: string;
    full_name: string;
    email: string;
}

interface Props {
    dossierId: string;
    labId: string;
    currentUserId: string;
    onAssignmentChange?: () => void;
}

export default function DossierAssignments({ dossierId, labId, currentUserId, onAssignmentChange }: Props) {
    const [assignments, setAssignments] = useState<AssignedUser[]>([]);
    const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [dossierId]);

    const loadData = async () => {
        setLoading(true);
        const current = await getAssignmentsForDossier(dossierId);
        setAssignments(current);

        const assignedIds = current.map(a => a.user_id);
        const available = await getTecnicosAvailable(assignedIds);
        setAvailableUsers(available);

        setLoading(false);
    };

    const handleAssign = async () => {
        if (!selectedUserId) return;
        setSaving(true);

        const result = await assignTechnicianToDossier(dossierId, selectedUserId, currentUserId);

        if (result.error) {
            alert('Error al asignar: ' + result.error);
        } else {
            setSelectedUserId('');
            await loadData();
            onAssignmentChange?.();
        }
        setSaving(false);
    };

    const handleUnassign = async (userId: string) => {
        if (!confirm('¿Quitar acceso a este técnico?')) return;
        setSaving(true);

        const result = await unassignTechnicianFromDossier(dossierId, userId);

        if (result.error) {
            alert('Error al quitar asignación: ' + result.error);
        } else {
            await loadData();
            onAssignmentChange?.();
        }
        setSaving(false);
    };

    if (loading) return <div className="text-xs text-gray-400 py-2">Cargando asignaciones...</div>;

    return (
        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h4 className="text-sm font-semibold text-indigo-800 mb-3 flex items-center gap-2">
                <Users size={16} />
                Técnicos asignados a este dossier
            </h4>

            {assignments.length === 0 ? (
                <p className="text-xs text-gray-500 mb-3">Ningún técnico asignado aún.</p>
            ) : (
                <ul className="space-y-2 mb-3">
                    {assignments.map((a) => (
                        <li key={a.id} className="flex items-center justify-between bg-white rounded border border-indigo-100 px-3 py-2">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{a.profiles.full_name}</p>
                                <p className="text-xs text-gray-400">{a.profiles.email}</p>
                            </div>
                            <button
                                onClick={() => handleUnassign(a.user_id)}
                                disabled={saving}
                                className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                                title="Quitar acceso"
                            >
                                <UserMinus size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {availableUsers.length > 0 ? (
                <div className="flex items-center gap-2">
                    <select
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="flex-1 text-sm border border-indigo-200 rounded px-2 py-1.5 bg-white"
                    >
                        <option value="">Seleccionar técnico...</option>
                        {availableUsers.map((u) => (
                            <option key={u.user_id} value={u.user_id}>
                                {u.full_name} ({u.email})
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAssign}
                        disabled={!selectedUserId || saving}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                    >
                        <UserPlus size={14} />
                        {saving ? 'Guardando...' : 'Asignar'}
                    </button>
                </div>
            ) : (
                assignments.length > 0 && (
                    <p className="text-xs text-gray-400">Todos los técnicos ya están asignados.</p>
                )
            )}

            {availableUsers.length === 0 && assignments.length === 0 && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                    No hay usuarios con rol "Técnico Regulatorio" creados aún.
                </p>
            )}
        </div>
    );
}
