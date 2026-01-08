export type UserRole =
    | 'super_admin'
    | 'lab_admin'
    | 'lab_uploader'
    | 'lab_viewer'
    | 'reviewer';

export type ProductType = 'medicine_general' | 'biologic' | 'device_medical';

export type DossierStatus = 'draft' | 'in_progress' | 'ready' | 'submitted';

export type ItemStatus = 'pending' | 'uploaded' | 'in_review' | 'approved' | 'observed';

export type ReviewDecision = 'approved' | 'observed';

export type AIProvider = 'openai' | 'gemini';

export type DocumentScope = 'checklist' | 'extra';

/**
 * Verificar si un rol puede subir documentos
 */
export function canUploadDocuments(role: UserRole): boolean {
    return ['super_admin', 'lab_admin', 'lab_uploader'].includes(role);
}

/**
 * Verificar si un rol puede revisar documentos
 */
export function canReviewDocuments(role: UserRole): boolean {
    return ['super_admin', 'reviewer'].includes(role);
}

/**
 * Verificar si un rol puede gestionar usuarios
 */
export function canManageUsers(role: UserRole): boolean {
    return ['super_admin', 'lab_admin'].includes(role);
}

/**
 * Verificar si un rol tiene acceso total de administración
 */
export function isSuperAdmin(role: UserRole): boolean {
    return role === 'super_admin';
}

/**
 * Verificar si un rol puede eliminar documentos
 */
export function canDeleteDocuments(role: UserRole): boolean {
    return ['super_admin', 'lab_admin', 'lab_uploader'].includes(role);
}

/**
 * Verificar si un rol puede editar configuración del laboratorio
 */
export function canEditLabSettings(role: UserRole): boolean {
    return ['super_admin', 'lab_admin'].includes(role);
}

/**
 * Obtener el nombre legible del rol
 */
export function getRoleName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
        super_admin: 'Super Administrador',
        lab_admin: 'Administrador de Laboratorio',
        lab_uploader: 'Cargador de Documentos',
        lab_viewer: 'Visor',
        reviewer: 'Revisor Externo',
    };
    return roleNames[role];
}

/**
 * Obtener el nombre del tipo de producto
 */
export function getProductTypeName(type: ProductType): string {
    const typeNames: Record<ProductType, string> = {
        medicine_general: 'Medicamento General',
        biologic: 'Biológico',
        device_medical: 'Dispositivo Médico',
    };
    return typeNames[type];
}

/**
 * Obtener el nombre del estado del ítem
 */
export function getItemStatusName(status: ItemStatus): string {
    const statusNames: Record<ItemStatus, string> = {
        pending: 'Pendiente',
        uploaded: 'Subido',
        in_review: 'En Revisión',
        approved: 'Aprobado',
        observed: 'Observado',
    };
    return statusNames[status];
}

/**
 * Obtener color para el estado del ítem
 */
export function getItemStatusColor(status: ItemStatus): string {
    const statusColors: Record<ItemStatus, string> = {
        pending: 'bg-gray-100 text-gray-800',
        uploaded: 'bg-blue-100 text-blue-800',
        in_review: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-green-100 text-green-800',
        observed: 'bg-red-100 text-red-800',
    };
    return statusColors[status];
}
