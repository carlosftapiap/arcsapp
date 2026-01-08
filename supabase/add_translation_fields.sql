-- =====================================================
-- Agregar campos de traducción para comentarios
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campo comments_i18n a technical_reviews para traducciones
ALTER TABLE technical_reviews 
ADD COLUMN IF NOT EXISTS comments_i18n JSONB DEFAULT '{}';

-- Comentario: Este campo guardará: {"es": "texto español", "en": "english text"}

-- 2. Agregar campo conclusion_i18n a ai_document_analyses para traducciones del análisis
ALTER TABLE ai_document_analyses 
ADD COLUMN IF NOT EXISTS analysis_json_i18n JSONB DEFAULT '{}';

-- Comentario: Este campo guardará las conclusiones y observaciones en ambos idiomas

-- 3. Crear índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_technical_reviews_comments_i18n 
ON technical_reviews USING gin(comments_i18n);

-- 4. Verificar que se aplicaron los cambios
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'technical_reviews' 
AND column_name IN ('comments', 'comments_i18n');

SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_document_analyses' 
AND column_name IN ('analysis_json', 'analysis_json_i18n');
