-- Migration: Add support for multiple files per checklist item
-- Some items require multiple documents (CoA APIs, stability studies, chromatograms, labels)

-- Add column to checklist_items
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS allows_multiple_files BOOLEAN DEFAULT false;

-- Add column to track file category/subcategory for multi-file items
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS file_subcategory VARCHAR(100);

-- Update items that MUST allow multiple files (OBLIGATORIO)
-- B-02: CoA Materias Primas / API
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'B-02';

-- C-01: Estudios de Estabilidad
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'C-01';

-- C-03: Cromatogramas / Registros Analíticos
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'C-03';

-- C-05: Etiquetas (primaria, secundaria, inserto)
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'C-05';

-- Update items that FREQUENTLY have multiple files (FRECUENTE)
-- B-09: Metodología Analítica y Validación
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'B-09';

-- B-07: Proceso de Manufactura
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'B-07';

-- B-08: Flujograma del Proceso
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'B-08';

-- A-01: BPM / GMP (puede incluir anexos)
UPDATE checklist_items SET allows_multiple_files = true WHERE code = 'A-01';

-- Items that should remain SINGLE file (default false, but explicit for clarity)
-- B-01: CoA Producto Terminado - 1 lote
-- B-03: Especificaciones - Documento único
-- B-04: Fórmula - Documento único
-- B-05: Justificación fórmula - Documento único
-- A-03: Declaración titular - Documento único
-- A-04: Poder legal - Documento único

-- Create index for faster queries on file categories
CREATE INDEX IF NOT EXISTS idx_documents_file_category ON documents(file_category);
CREATE INDEX IF NOT EXISTS idx_documents_file_subcategory ON documents(file_subcategory);

-- Add comment explaining the logic
COMMENT ON COLUMN checklist_items.allows_multiple_files IS 
'Indicates if this checklist item accepts multiple file uploads. 
TRUE for: B-02 (CoA MPs), C-01 (Estabilidad), C-03 (Cromatogramas), C-05 (Etiquetas), B-09, B-07, B-08, A-01.
FALSE for: B-01, B-03, B-04, B-05, A-03, A-04 (single document items).';

COMMENT ON COLUMN documents.file_category IS 
'Category of the file within multi-file items. E.g., "API", "Colorante", "Conservante" for B-02';

COMMENT ON COLUMN documents.file_subcategory IS 
'Subcategory for more specific classification. E.g., "Amoxicilina", "Tartrazina" for B-02';
