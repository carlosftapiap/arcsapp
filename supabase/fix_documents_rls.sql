-- =====================================================
-- ARCSAPP - Fix Document Upload Permissions (RLS)
-- =====================================================

-- 1. Habilitar RLS en la tabla documents (por seguridad, si no estaba)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Users can upload documents for their lab dossiers" ON documents;
DROP POLICY IF EXISTS "Users can view documents for their lab dossiers" ON documents;
DROP POLICY IF EXISTS "Lab members can view documents" ON documents;
DROP POLICY IF EXISTS "Lab uploaders can insert documents" ON documents;

-- 3. Crear política de INSERT para 'documents'
-- Permite insertar si el usuario es super_admin O pertenece al laboratorio del dossier con rol adecuado
CREATE POLICY "Lab uploaders can insert documents" ON documents
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM dossier_items di
    JOIN dossiers d ON di.dossier_id = d.id
    JOIN lab_members lm ON lm.lab_id = d.lab_id
    WHERE di.id = documents.dossier_item_id
    AND lm.user_id = auth.uid()
    AND lm.role IN ('lab_admin', 'lab_uploader')
  )
  OR
  EXISTS (
      SELECT 1 FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'super_admin'
  )
);

-- 4. Crear política de SELECT para 'documents'
-- Permite ver si pertenece al laboratorio o es reviewer/super_admin
CREATE POLICY "Lab members and reviewers can view documents" ON documents
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM dossier_items di
    JOIN dossiers d ON di.dossier_id = d.id
    LEFT JOIN lab_members lm ON lm.lab_id = d.lab_id AND lm.user_id = auth.uid()
    WHERE di.id = documents.dossier_item_id
    AND (
      lm.role IS NOT NULL -- Es miembro del laboratorio
      OR
      EXISTS (SELECT 1 FROM lab_members WHERE user_id = auth.uid() AND role IN ('reviewer', 'super_admin'))
    )
  )
);

-- =====================================================
-- STORAGE POLICIES (Bucket: dossier-documents)
-- =====================================================

-- Asegurarse de que el bucket existe (opcional, suele existir)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dossier-documents', 'dossier-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Eliminar políticas de storage antiguas para este bucket
DROP POLICY IF EXISTS "Verified users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Lab users can upload dossier files" ON storage.objects;
DROP POLICY IF EXISTS "Lab users can view dossier files" ON storage.objects;

-- Insert Policy
CREATE POLICY "Lab users can upload dossier files" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'dossier-documents' AND
  (auth.role() = 'authenticated')
);

-- Select Policy
CREATE POLICY "Lab users can view dossier files" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'dossier-documents' AND
  (auth.role() = 'authenticated')
);

-- Update/Delete Policy (para reemplazar archivos)
CREATE POLICY "Lab users can update/delete dossier files" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'dossier-documents' AND
  (auth.role() = 'authenticated')
);

CREATE POLICY "Lab users can update dossier files" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'dossier-documents' AND
  (auth.role() = 'authenticated')
);
