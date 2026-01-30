-- Función RPC para obtener actividad reciente combinando múltiples tablas
-- Se usa para el dashboard de actividad del administrador

CREATE OR REPLACE FUNCTION get_recent_activity(
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_lab_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    description TEXT,
    entity_id UUID,        -- ID del dossier relacionado
    entity_name TEXT,      -- Nombre del dossier
    user_id UUID,
    user_name TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH activities AS (
        -- 1. Nuevos Dossiers
        SELECT 
            d.id as source_id,
            'dossier_created' as type,
            'Nuevo dossier creado' as desc_text,
            d.id as e_id,
            d.product_name as e_name,
            d.created_by as u_id,
            d.created_at as time_at,
            jsonb_build_object('product_type', d.product_type) as meta,
            d.lab_id
        FROM dossiers d
        
        UNION ALL
        
        -- 2. Cambios de Estado en Dossiers
        -- (Nota: Esto es aproximado ya que no tenemos histórico de estados, usamos updated_at si difiere mucho de created_at)
        SELECT 
            d.id as source_id,
            'dossier_status' as type,
            'Dossier cambió de estado a ' || d.status as desc_text,
            d.id as e_id,
            d.product_name as e_name,
            d.created_by as u_id, -- Usamos created_by como fallback, idealmente sería last_modified_by
            d.updated_at as time_at,
            jsonb_build_object('status', d.status) as meta,
            d.lab_id
        FROM dossiers d
        WHERE d.updated_at > d.created_at + interval '1 minute'
        
        UNION ALL
        
        -- 3. Documentos Subidos
        SELECT 
            doc.id as source_id,
            'document_uploaded' as type,
            'Se subió un documento V' || doc.version as desc_text,
            d.id as e_id,
            d.product_name as e_name,
            doc.uploaded_by as u_id,
            doc.uploaded_at as time_at,
            jsonb_build_object('file_name', split_part(doc.file_path, '/', array_length(string_to_array(doc.file_path, '/'), 1))) as meta,
            d.lab_id
        FROM documents doc
        JOIN dossier_items di ON doc.dossier_item_id = di.id
        JOIN dossiers d ON di.dossier_id = d.id
        
        UNION ALL
        
        -- 4. Revisiones/Comentarios
        SELECT 
            r.id as source_id,
            'review_added' as type,
            CASE 
                WHEN r.decision = 'approved' THEN 'Documento aprobado'
                WHEN r.decision = 'observed' THEN 'Documento observado'
                ELSE 'Revisión agregada'
            END as desc_text,
            d.id as e_id,
            d.product_name as e_name,
            r.reviewer_user_id as u_id,
            r.created_at as time_at,
            jsonb_build_object('decision', r.decision) as meta,
            d.lab_id
        FROM remarks r
        JOIN dossier_items di ON r.dossier_item_id = di.id
        JOIN dossiers d ON di.dossier_id = d.id
        
        UNION ALL
        
        -- 5. Comentarios de Laboratorio
        SELECT 
            di.id as source_id, -- Usamos ID del item ya que los comentarios están en JSONB por ahora, usamos updated_at
            'lab_comment' as type,
            'Laboratorio agregó un comentario' as desc_text,
            d.id as e_id,
            d.product_name as e_name,
            d.created_by as u_id, -- Fallback
            di.updated_at as time_at,
            di.lab_comment_json as meta,
            d.lab_id
        FROM dossier_items di
        JOIN dossiers d ON di.dossier_id = d.id
        WHERE di.lab_comment_json IS NOT NULL 
          AND di.updated_at > d.created_at
    )
    SELECT 
        a.source_id,
        a.type,
        a.desc_text,
        a.e_id,
        a.e_name,
        a.u_id,
        p.full_name as user_name,
        a.time_at,
        a.meta
    FROM activities a
    LEFT JOIN profiles p ON a.u_id = p.user_id
    WHERE (p_lab_id IS NULL OR a.lab_id = p_lab_id)
      AND a.time_at IS NOT NULL
    ORDER BY a.time_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
