-- Tabla para almacenar auditorías de documentos
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    lab_id UUID REFERENCES labs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL, -- Opcional: relacionar con producto
    dossier_id UUID REFERENCES dossiers(id) ON DELETE SET NULL, -- Opcional: relacionar con dossier
    
    -- Identificación del medicamento/producto
    product_name TEXT NOT NULL, -- Nombre del medicamento (obligatorio)
    manufacturer TEXT, -- Fabricante
    
    -- Información del archivo
    file_name TEXT NOT NULL,
    file_path TEXT, -- Ruta en Supabase Storage
    file_size_bytes BIGINT,
    total_pages INTEGER,
    
    -- Resultados del análisis
    stages_found JSONB DEFAULT '[]'::jsonb,
    problems_found JSONB DEFAULT '[]'::jsonb,
    summary TEXT,
    
    -- Estadísticas de procesamiento
    chunks_processed INTEGER,
    total_chars INTEGER,
    processing_time_ms INTEGER,
    
    -- Estado
    status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audits_lab_id ON audits(lab_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_audits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_audits_updated_at ON audits;
CREATE TRIGGER trigger_audits_updated_at
    BEFORE UPDATE ON audits
    FOR EACH ROW
    EXECUTE FUNCTION update_audits_updated_at();

-- RLS (Row Level Security)
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso (DROP primero para evitar duplicados)
DROP POLICY IF EXISTS "Users can view audits from their lab" ON audits;
CREATE POLICY "Users can view audits from their lab"
    ON audits FOR SELECT
    USING (
        lab_id IN (
            SELECT lab_id FROM lab_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert audits for their lab" ON audits;
CREATE POLICY "Users can insert audits for their lab"
    ON audits FOR INSERT
    WITH CHECK (
        lab_id IN (
            SELECT lab_id FROM lab_members WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Lab admins can delete audits" ON audits;
CREATE POLICY "Lab admins can delete audits"
    ON audits FOR DELETE
    USING (
        lab_id IN (
            SELECT lab_id FROM lab_members 
            WHERE user_id = auth.uid() 
            AND role IN ('lab_admin', 'super_admin')
        )
    );

-- Comentarios
COMMENT ON TABLE audits IS 'Almacena auditorías de documentos PDF con análisis de IA';
COMMENT ON COLUMN audits.stages_found IS 'JSON array de etapas ARCSA encontradas con páginas';
COMMENT ON COLUMN audits.problems_found IS 'JSON array de problemas detectados con tipo y página';
