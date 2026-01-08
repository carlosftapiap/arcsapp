-- Tabla para análisis consolidado de IA por etapa (dossier_item)
-- Esto permite analizar TODOS los PDFs de una etapa multi-archivo juntos

CREATE TABLE IF NOT EXISTS ai_item_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_item_id UUID NOT NULL REFERENCES dossier_items(id) ON DELETE CASCADE,
    executed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    provider VARCHAR(50) DEFAULT 'openai',
    model VARCHAR(100) DEFAULT 'gpt-4o-mini',
    files_analyzed TEXT[] DEFAULT '{}',
    analysis_json JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'success',
    needs_ocr BOOLEAN DEFAULT FALSE,
    error_message TEXT
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_item_analyses_item ON ai_item_analyses(dossier_item_id);
CREATE INDEX IF NOT EXISTS idx_ai_item_analyses_created ON ai_item_analyses(created_at DESC);

-- RLS
ALTER TABLE ai_item_analyses ENABLE ROW LEVEL SECURITY;

-- Política SELECT: usuarios pueden ver análisis de items de sus labs
DROP POLICY IF EXISTS "Usuarios pueden ver análisis de items accesibles" ON ai_item_analyses;
CREATE POLICY "Usuarios pueden ver análisis de items accesibles"
  ON ai_item_analyses FOR SELECT
  USING (
    dossier_item_id IN (
      SELECT di.id FROM dossier_items di
      INNER JOIN dossiers dos ON dos.id = di.dossier_id
      WHERE dos.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

-- Política INSERT: usuarios autenticados pueden crear análisis
DROP POLICY IF EXISTS "Usuarios pueden crear análisis de items" ON ai_item_analyses;
CREATE POLICY "Usuarios pueden crear análisis de items"
  ON ai_item_analyses FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política UPDATE: solo el ejecutor o admins
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus análisis" ON ai_item_analyses;
CREATE POLICY "Usuarios pueden actualizar sus análisis"
  ON ai_item_analyses FOR UPDATE
  USING (
    executed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.user_id = auth.uid() 
      AND profiles.role IN ('super_admin', 'reviewer')
    )
  );

SELECT 'Tabla ai_item_analyses creada con RLS' AS status;
