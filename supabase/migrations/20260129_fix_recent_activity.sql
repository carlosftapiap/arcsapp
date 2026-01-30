-- Eliminar versión anterior por si acaso
DROP FUNCTION IF EXISTS get_recent_activity(integer, integer, uuid);

-- Crear función con SECURITY DEFINER para asegurar acceso a las tablas
CREATE OR REPLACE FUNCTION get_recent_activity(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_lab_id UUID DEFAULT NULL
)
RETURNS TABLE (
    source_id UUID,
    type TEXT,
    desc_text TEXT,
    e_id UUID,
    e_name TEXT,
    u_id UUID,
    user_name TEXT,
    time_at TIMESTAMPTZ,
    meta JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH activities AS (
        -- 1. Nuevos Dossiers
        SELECT 
            d.id as _source_id,
            'dossier_created'::text as _type,
            'Nuevo dossier creado'::text as _desc_text,
            d.id as _e_id,
            d.product_name as _e_name,
            d.created_by as _u_id,
            d.created_at as _time_at,
            jsonb_build_object('product_type', d.product_type) as _meta,
            d.lab_id as _lab_id
        FROM dossiers d
        
        UNION ALL
        
        -- 2. Cambios de Estado (usando updated_at como proxy)
        SELECT 
            d.id,
            'dossier_status',
            'Dossier cambió de estado a ' || d.status,
            d.id,
            d.product_name,
            d.created_by, -- Fallback user
            d.updated_at,
            jsonb_build_object('status', d.status),
            d.lab_id
        FROM dossiers d
        WHERE d.updated_at > d.created_at + interval '1 minute'
        
        UNION ALL
        
        -- 3. Documentos
        SELECT 
            doc.id,
            'document_uploaded',
            'Se subió un documento V' || doc.version,
            d.id,
            d.product_name,
            doc.uploaded_by,
            doc.uploaded_at,
            jsonb_build_object('file_path', doc.file_path),
            d.lab_id
        FROM documents doc
        JOIN dossier_items di ON doc.dossier_item_id = di.id
        JOIN dossiers d ON di.dossier_id = d.id
    )
    SELECT 
        a._source_id,
        a._type,
        a._desc_text,
        a._e_id,
        a._e_name,
        a._u_id,
        COALESCE(p.full_name, 'Usuario'),
        a._time_at,
        a._meta
    FROM activities a
    LEFT JOIN profiles p ON a._u_id = p.user_id
    WHERE (p_lab_id IS NULL OR a._lab_id = p_lab_id)
    ORDER BY a._time_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Otorgar permisos explícitos
GRANT EXECUTE ON FUNCTION get_recent_activity(integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(integer, integer, uuid) TO service_role;
