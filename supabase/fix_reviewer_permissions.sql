-- =====================================================
-- RLS para technical_reviews - Permitir que reviewers creen dictámenes
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Habilitar RLS en la tabla
ALTER TABLE technical_reviews ENABLE ROW LEVEL SECURITY;

-- 2. Política para VER revisiones (cualquier usuario con acceso al dossier)
DROP POLICY IF EXISTS "Usuarios pueden ver revisiones de documentos accesibles" ON technical_reviews;

CREATE POLICY "Usuarios pueden ver revisiones de documentos accesibles"
  ON technical_reviews FOR SELECT
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      INNER JOIN dossier_items di ON di.id = d.dossier_item_id
      INNER JOIN dossiers dos ON dos.id = di.dossier_id
      WHERE dos.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

-- 3. Política para CREAR revisiones (reviewers y super_admin)
DROP POLICY IF EXISTS "Revisores pueden crear revisiones técnicas" ON technical_reviews;

CREATE POLICY "Revisores pueden crear revisiones técnicas"
  ON technical_reviews FOR INSERT
  WITH CHECK (
    -- El reviewer_id debe ser el usuario actual
    reviewer_id = auth.uid()
    AND
    -- Y debe tener acceso al documento
    document_id IN (
      SELECT d.id FROM documents d
      INNER JOIN dossier_items di ON di.id = d.dossier_item_id
      INNER JOIN dossiers dos ON dos.id = di.dossier_id
      WHERE dos.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

-- 4. También habilitar RLS en ai_document_analyses si no está habilitado
ALTER TABLE ai_document_analyses ENABLE ROW LEVEL SECURITY;

-- Política para ver análisis de IA
DROP POLICY IF EXISTS "Usuarios pueden ver análisis IA de documentos accesibles" ON ai_document_analyses;

CREATE POLICY "Usuarios pueden ver análisis IA de documentos accesibles"
  ON ai_document_analyses FOR SELECT
  USING (
    document_id IN (
      SELECT d.id FROM documents d
      INNER JOIN dossier_items di ON di.id = d.dossier_item_id
      INNER JOIN dossiers dos ON dos.id = di.dossier_id
      WHERE dos.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

-- 5. Verificar que todo esté correcto
SELECT 'RLS habilitado correctamente' AS status;
