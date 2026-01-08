-- Tabla para Análisis de IA (Historial y Resultados)
CREATE TABLE IF NOT EXISTS ai_document_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    executed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    provider VARCHAR(50), -- 'openai', 'gemini'
    model VARCHAR(50),
    analysis_json JSONB, -- Resultado completo
    alerts JSONB, -- Array de alertas simplificadas: [{type: 'error', message: 'Caducado'}]
    status VARCHAR(50) -- 'success', 'failed', 'processing'
);

-- Tabla para Revisiones Técnicas (Dictámenes)
CREATE TABLE IF NOT EXISTS technical_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    decision VARCHAR(50) CHECK (decision IN ('approved', 'observed', 'rejected')),
    comments TEXT,
    version_reviewed INTEGER -- Para saber qué versión del doc se revisó
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_ai_analyses_doc ON ai_document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_technical_reviews_doc ON technical_reviews(document_id);

-- Limpieza (Opcional: Migrar datos viejos si los hubiera, por ahora asumimos fresh start en dev)
-- ALTER TABLE dossier_items DROP COLUMN IF EXISTS reviewer_notes; -- Dejamos caer esto luego
