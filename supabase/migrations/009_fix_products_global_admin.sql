-- =====================================================
-- FIX: Permitir a Super Admins operar en CUALQUIER laboratorio
-- =====================================================

-- 1. Política SELECT (Ver productos)
DROP POLICY IF EXISTS "Lab members pueden ver productos" ON products;
CREATE POLICY "Lab members pueden ver productos"
  ON products FOR SELECT
  USING (
    -- Si es Super Admin global (tiene el rol en alguna parte)
    EXISTS (SELECT 1 FROM get_my_lab_roles() WHERE role = 'super_admin')
    OR
    -- O si pertenece al laboratorio del producto
    lab_id IN (SELECT r.lab_id FROM get_my_lab_roles() r)
  );

-- 2. Política INSERT (Crear productos)
DROP POLICY IF EXISTS "Lab members pueden crear productos" ON products;
CREATE POLICY "Lab members pueden crear productos"
  ON products FOR INSERT
  WITH CHECK (
    -- Super Admin Global
    EXISTS (SELECT 1 FROM get_my_lab_roles() WHERE role = 'super_admin')
    OR
    -- Admin/Uploader del laboratorio específico
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('lab_admin', 'lab_uploader')
    )
  );

-- 3. Política UPDATE (Editar productos)
DROP POLICY IF EXISTS "Lab admin pueden actualizar productos" ON products;
CREATE POLICY "Lab admin pueden actualizar productos"
  ON products FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM get_my_lab_roles() WHERE role = 'super_admin')
    OR
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('lab_admin', 'lab_uploader')
    )
  );

-- 4. Política DELETE (Eliminar productos)
DROP POLICY IF EXISTS "Lab admin pueden eliminar productos" ON products;
CREATE POLICY "Lab admin pueden eliminar productos"
  ON products FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM get_my_lab_roles() WHERE role = 'super_admin')
    OR
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('lab_admin', 'lab_uploader')
    )
  );
