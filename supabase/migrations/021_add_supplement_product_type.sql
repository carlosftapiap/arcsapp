-- Migración: Agregar tipos de producto faltantes al constraint de products
-- Actualmente solo permite: 'medicine_general', 'device_medical'
-- Necesitamos agregar: 'supplement_food', 'biologic'

-- 1. Eliminar el constraint existente en products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;

-- 2. Agregar el nuevo constraint con todos los tipos
ALTER TABLE products ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food'));

-- 3. También actualizar el constraint en dossiers si es necesario
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_product_type_check;

ALTER TABLE dossiers ADD CONSTRAINT dossiers_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food'));

-- 4. También actualizar el constraint en checklist_templates
ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_product_type_check;

ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food'));
