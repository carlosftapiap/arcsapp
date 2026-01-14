-- Migración: Eliminar sub-etapas B-01.x
-- Solo debe existir B-01 como etapa consolidada, no las sub-etapas individuales

-- 1. Primero eliminar los dossier_items que referencian estas sub-etapas
DELETE FROM dossier_items 
WHERE checklist_item_id IN (
    SELECT id FROM checklist_items 
    WHERE code IN ('B-01.1', 'B-01.2', 'B-01.3', 'B-01.4', 'B-01.5', 'B-01.6',
                   'B-01-1', 'B-01-2', 'B-01-3', 'B-01-4', 'B-01-5', 'B-01-6')
);

-- 2. Luego eliminar los checklist_items con esos códigos
DELETE FROM checklist_items 
WHERE code IN ('B-01.1', 'B-01.2', 'B-01.3', 'B-01.4', 'B-01.5', 'B-01.6',
               'B-01-1', 'B-01-2', 'B-01-3', 'B-01-4', 'B-01-5', 'B-01-6');

-- Resultado: Solo queda B-01 como etapa única de Desarrollo y Fabricación
