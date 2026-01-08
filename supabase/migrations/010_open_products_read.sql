-- =====================================================
-- FIX: Permitir lectura GLOBAL de productos para debug
-- =====================================================

DROP POLICY IF EXISTS "Lab members pueden ver productos" ON products;

CREATE POLICY "Usuarios autenticados pueden ver todos los productos"
  ON products FOR SELECT
  USING (
    auth.role() = 'authenticated'
  );
