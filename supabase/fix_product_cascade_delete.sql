-- =====================================================
-- Corregir cascada de eliminación: products -> dossiers
-- =====================================================
-- Cuando se elimina un producto, también se deben eliminar sus dossiers

-- 1. Eliminar la constraint existente
ALTER TABLE dossiers 
DROP CONSTRAINT IF EXISTS dossiers_product_id_fkey;

-- 2. Agregar la nueva constraint con ON DELETE CASCADE
ALTER TABLE dossiers
ADD CONSTRAINT dossiers_product_id_fkey 
FOREIGN KEY (product_id) 
REFERENCES products(id) 
ON DELETE CASCADE;

-- 3. Verificar la constraint
SELECT 
    conname AS constraint_name,
    confdeltype AS delete_action
FROM pg_constraint
WHERE conrelid = 'dossiers'::regclass
AND conname = 'dossiers_product_id_fkey';

-- delete_action:
-- 'a' = NO ACTION
-- 'r' = RESTRICT
-- 'c' = CASCADE
-- 'n' = SET NULL
-- 'd' = SET DEFAULT
