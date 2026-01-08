-- =====================================================
-- FIX DATA: Asignar productos de 'DOCTIVO' a su laboratorio correcto
-- =====================================================

DO $$
DECLARE
  v_doctivo_lab_id UUID;
BEGIN
  -- 1. Buscar el ID del laboratorio 'DOCTIVO' (o parecido)
  SELECT id INTO v_doctivo_lab_id
  FROM labs
  WHERE name ILIKE '%DOCTIVO%'
  LIMIT 1;

  IF v_doctivo_lab_id IS NOT NULL THEN
    
    -- 2. Actualizar productos que tengan 'DOCTIVO' como fabricante
    --    para que pertenezcan al laboratorio correcto.
    UPDATE products
    SET lab_id = v_doctivo_lab_id
    WHERE fabricante ILIKE '%DOCTIVO%'
    AND lab_id != v_doctivo_lab_id;
    
    RAISE NOTICE 'Productos movidos al laboratorio Doctivo (ID: %)', v_doctivo_lab_id;
    
  ELSE
    RAISE NOTICE 'No se encontró el laboratorio Doctivo.';
  END IF;

END $$;
