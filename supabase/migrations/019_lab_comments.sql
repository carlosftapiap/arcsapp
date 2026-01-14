-- Migración: Agregar campo de comentario del laboratorio en dossier_items
-- Este campo permite al laboratorio agregar notas/comentarios en cada etapa
-- Los comentarios se guardan traducidos en formato JSONB (es, en, hi, zh-CN)

ALTER TABLE dossier_items
ADD COLUMN IF NOT EXISTS lab_comment_json JSONB DEFAULT NULL;

-- Comentario: lab_comment_json almacena traducciones como:
-- {"es": "Comentario en español", "en": "Comment in English", "hi": "...", "zh-CN": "..."}

COMMENT ON COLUMN dossier_items.lab_comment_json IS 'Comentario del laboratorio traducido a múltiples idiomas (JSONB)';
