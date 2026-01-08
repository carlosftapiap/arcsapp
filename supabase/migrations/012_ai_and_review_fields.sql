-- Integraciones IA en Labs
ALTER TABLE labs
ADD COLUMN IF NOT EXISTS openai_api_key TEXT,
ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;

-- Campos para Revisión Técnica en los Items del Dossier
ALTER TABLE dossier_items
ADD COLUMN IF NOT EXISTS reviewer_notes TEXT, -- Observaciones de la técnica
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending', -- approved, rejected, changes_requested
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Check constraint para status
ALTER TABLE dossier_items
DROP CONSTRAINT IF EXISTS check_review_status;

ALTER TABLE dossier_items
ADD CONSTRAINT check_review_status 
CHECK (review_status IN ('pending', 'approved', 'rejected', 'changes_requested'));
