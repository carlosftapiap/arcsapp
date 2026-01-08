-- Fix RLS policies for ai_document_analyses table
-- Permite INSERT y UPDATE para usuarios autenticados

-- Política para insertar análisis de IA
DROP POLICY IF EXISTS "Usuarios pueden crear análisis IA" ON ai_document_analyses;

CREATE POLICY "Usuarios pueden crear análisis IA"
  ON ai_document_analyses FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Política para actualizar análisis de IA
DROP POLICY IF EXISTS "Usuarios pueden actualizar análisis IA" ON ai_document_analyses;

CREATE POLICY "Usuarios pueden actualizar análisis IA"
  ON ai_document_analyses FOR UPDATE
  USING (
    executed_by = auth.uid()
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('super_admin', 'reviewer')
    )
  );

-- Verificar
SELECT 'RLS ai_document_analyses corregido' AS status;
