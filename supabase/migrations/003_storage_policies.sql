-- =====================================================
-- ARCSAPP - CONFIGURACIÓN DE STORAGE
-- =====================================================

-- Crear bucket para documentos PDF
INSERT INTO storage.buckets (id, name, public)
VALUES ('dossier-documents', 'dossier-documents', false);

-- =====================================================
-- POLÍTICAS DE STORAGE: Subida de Archivos
-- =====================================================

CREATE POLICY "Lab members pueden subir documentos a su lab"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dossier-documents' AND
  -- La ruta debe ser: lab/{lab_id}/dossier/{dossier_id}/...
  (storage.foldername(name))[1] = 'lab' AND
  -- Verificar que el lab_id en la ruta pertenece al usuario
  (storage.foldername(name))[2]::uuid IN (
    SELECT lm.lab_id FROM lab_members lm
    WHERE lm.user_id = auth.uid() 
    AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
  )
);

-- =====================================================
-- POLÍTICAS DE STORAGE: Descarga de Archivos
-- =====================================================

CREATE POLICY "Lab members y revisores pueden descargar documentos de sus labs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dossier-documents' AND
  (storage.foldername(name))[1] = 'lab' AND
  (storage.foldername(name))[2]::uuid IN (
    -- Labs como miembro
    SELECT lm.lab_id FROM lab_members lm
    WHERE lm.user_id = auth.uid()
    
    UNION
    
    -- Labs como revisor asignado
    SELECT lra.lab_id FROM lab_reviewer_assignments lra
    WHERE lra.reviewer_user_id = auth.uid() AND lra.active = true
  )
);

-- =====================================================
-- POLÍTICAS DE STORAGE: Eliminación de Archivos
-- =====================================================

CREATE POLICY "Lab uploaders pueden eliminar documentos de su lab"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'dossier-documents' AND
  (storage.foldername(name))[1] = 'lab' AND
  (storage.foldername(name))[2]::uuid IN (
    SELECT lm.lab_id FROM lab_members lm
    WHERE lm.user_id = auth.uid() 
    AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
  )
);

-- =====================================================
-- POLÍTICAS DE STORAGE: Actualización de Archivos
-- =====================================================

CREATE POLICY "Lab uploaders pueden actualizar documentos de su lab"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'dossier-documents' AND
  (storage.foldername(name))[1] = 'lab' AND
  (storage.foldername(name))[2]::uuid IN (
    SELECT lm.lab_id FROM lab_members lm
    WHERE lm.user_id = auth.uid() 
    AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
  )
);
