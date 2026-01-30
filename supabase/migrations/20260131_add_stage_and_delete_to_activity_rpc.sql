-- Mejorar get_recent_activity para incluir el contexto de la etapa (código/título) y soportar eliminaciones
DROP FUNCTION IF EXISTS get_recent_activity(integer, integer, uuid);

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
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
        
        -- 2. Cambios de Estado
        SELECT 
            d.id,
            'dossier_status',
            'Dossier cambió de estado a ' || d.status,
            d.id,
            d.product_name,
            d.created_by,
            d.updated_at,
            jsonb_build_object('status', d.status),
            d.lab_id
        FROM dossiers d
        WHERE d.updated_at > d.created_at + interval '1 minute'
        
        UNION ALL
        
        -- 3. Documentos (Subidas y Eliminaciones)
        SELECT 
            doc.id,
            CASE 
                WHEN doc.status = 'deleted' THEN 'document_deleted' 
                ELSE 'document_uploaded' 
            END,
            CASE 
                WHEN doc.status = 'deleted' THEN 'Se eliminó documento V' || doc.version
                ELSE 'Se subió documento V' || doc.version
            END,
            d.id,
            d.product_name,
            CASE 
                WHEN doc.status = 'deleted' AND doc.deleted_by IS NOT NULL THEN doc.deleted_by 
                ELSE doc.uploaded_by 
            END,
            CASE 
                WHEN doc.status = 'deleted' AND doc.deleted_at IS NOT NULL THEN doc.deleted_at
                ELSE doc.uploaded_at 
            END,
            jsonb_build_object(
                'file_path', doc.file_path,
                'stage_code', ci.code,
                'stage_title', ci.title_i18n_json
            ),
            d.lab_id
        FROM documents doc
        JOIN dossier_items di ON doc.dossier_item_id = di.id
        JOIN checklist_items ci ON di.checklist_item_id = ci.id
        JOIN dossiers d ON di.dossier_id = d.id
    )
    SELECT 
        a._source_id::uuid AS source_id,
        a._type::text AS type,
        a._desc_text::text AS desc_text,
        a._e_id::uuid AS e_id,
        a._e_name::text AS e_name,
        a._u_id::uuid AS u_id,
        COALESCE(p.full_name, p.email, au.email, 'Usuario')::text AS user_name,
        a._time_at::timestamptz AS time_at,
        a._meta::jsonb AS meta
    FROM activities a
    LEFT JOIN profiles p ON a._u_id = p.user_id
    LEFT JOIN auth.users au ON a._u_id = au.id
    WHERE (p_lab_id IS NULL OR a._lab_id = p_lab_id)
    ORDER BY a._time_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$function$;

GRANT EXECUTE ON FUNCTION get_recent_activity(integer, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activity(integer, integer, uuid) TO service_role;
