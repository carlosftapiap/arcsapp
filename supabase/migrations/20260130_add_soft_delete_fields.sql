-- 1. Asegurar columnas (sin error si existen)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- 2. Actualizar función de actividad reciente
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
AS $$
BEGIN
    RETURN QUERY
    WITH activities AS (
        -- Dossierys Nuevos
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
        WHERE d.status != 'deleted'
        
        UNION ALL
        
        -- Cambios de Estado
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
        
        -- Documentos Subidos
        SELECT 
            doc.id,
            'document_uploaded',
            'Se subió: ' || split_part(doc.file_path, '/', -1),
            d.id,
            d.product_name,
            doc.uploaded_by,
            doc.uploaded_at,
            jsonb_build_object('file_path', doc.file_path, 'doc_version', doc.version),
            d.lab_id
        FROM documents doc
        JOIN dossier_items di ON doc.dossier_item_id = di.id
        JOIN dossiers d ON di.dossier_id = d.id
        WHERE doc.status != 'deleted'
        
        UNION ALL

        -- Documentos Borrados
        SELECT 
            doc.id,
            'document_deleted',
            'Se eliminó: ' || split_part(doc.file_path, '/', -1),
            d.id,
            d.product_name,
            doc.deleted_by,
            doc.deleted_at,
            jsonb_build_object('file_path', doc.file_path, 'doc_version', doc.version),
            d.lab_id
        FROM documents doc
        JOIN dossier_items di ON doc.dossier_item_id = di.id
        JOIN dossiers d ON di.dossier_id = d.id
        WHERE doc.status = 'deleted' AND doc.deleted_at IS NOT NULL
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
$$;

-- 3. Actualizar políticas de seguridad
DROP POLICY IF EXISTS "Super admin can soft delete documents" ON documents;
DROP POLICY IF EXISTS "Lab uploaders can update documents" ON documents;
DROP POLICY IF EXISTS "Lab uploaders can delete documents" ON documents;
DROP POLICY IF EXISTS "Lab users can update documents (Soft Delete)" ON documents;

CREATE POLICY "Lab users can update documents (Soft Delete)" ON documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM dossier_items di
    JOIN dossiers d ON di.dossier_id = d.id
    JOIN lab_members lm ON lm.lab_id = d.lab_id
    WHERE di.id = documents.dossier_item_id
    AND lm.user_id = auth.uid()
    AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
  )
  OR
  EXISTS (
      SELECT 1 FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossier_items di
    JOIN dossiers d ON di.dossier_id = d.id
    JOIN lab_members lm ON lm.lab_id = d.lab_id
    WHERE di.id = documents.dossier_item_id
    AND lm.user_id = auth.uid()
    AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
  )
  OR
  EXISTS (
      SELECT 1 FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'super_admin'
  )
);
