-- =====================================================
-- FIX: Agregar política DELETE para labs
-- =====================================================

-- Política DELETE para labs (solo super admin)
CREATE POLICY "Super admin puede eliminar labs"
  ON labs FOR DELETE
  USING (is_super_admin(auth.uid()));
