-- =====================================================
-- FIX: Infinite Recursion in lab_members RLS
-- =====================================================

-- 1. Función segura para obtener roles (SECURITY DEFINER evita RLS loop)
CREATE OR REPLACE FUNCTION get_my_lab_roles()
RETURNS TABLE (lab_id UUID, role VARCHAR)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT lm.lab_id, lm.role 
  FROM lab_members lm 
  WHERE lm.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- 2. Reescribir políticas de lab_members para usar la función segura

DROP POLICY IF EXISTS "Lab admins pueden ver miembros de su lab" ON lab_members;
CREATE POLICY "Lab admins pueden ver miembros de su lab"
  ON lab_members FOR SELECT
  USING (
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('super_admin', 'lab_admin')
    )
  );

DROP POLICY IF EXISTS "Super admin y lab_admin pueden insertar miembros" ON lab_members;
CREATE POLICY "Super admin y lab_admin pueden insertar miembros"
  ON lab_members FOR INSERT
  WITH CHECK (
    is_super_admin(auth.uid()) OR
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role = 'lab_admin'
    )
  );

DROP POLICY IF EXISTS "Super admin y lab_admin pueden eliminar miembros" ON lab_members;
CREATE POLICY "Super admin y lab_admin pueden eliminar miembros"
  ON lab_members FOR DELETE
  USING (
    is_super_admin(auth.uid()) OR
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role = 'lab_admin'
    )
  );

-- 3. Actualizar políticas de Products para mayor seguridad (opcional, pero recomendado)

DROP POLICY IF EXISTS "Lab members pueden crear productos" ON products;
CREATE POLICY "Lab members pueden crear productos"
  ON products FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

DROP POLICY IF EXISTS "Lab admin pueden actualizar productos" ON products;
CREATE POLICY "Lab admin pueden actualizar productos"
  ON products FOR UPDATE
  USING (
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('super_admin', 'lab_admin')
    )
  );

DROP POLICY IF EXISTS "Lab admin pueden eliminar productos" ON products;
CREATE POLICY "Lab admin pueden eliminar productos"
  ON products FOR DELETE
  USING (
    lab_id IN (
      SELECT r.lab_id FROM get_my_lab_roles() r
      WHERE r.role IN ('super_admin', 'lab_admin')
    )
  );
