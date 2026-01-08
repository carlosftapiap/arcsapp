-- =====================================================
-- FIX: Permitir que usuarios con rol 'reviewer' en profiles
-- puedan ver todos los laboratorios activos
-- =====================================================
-- Ejecutar en Supabase SQL Editor

-- 1. Crear función helper para verificar si es revisor global
CREATE OR REPLACE FUNCTION is_global_reviewer(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = user_uuid 
    AND role IN ('reviewer', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Actualizar la función get_user_lab_ids para incluir revisores globales
CREATE OR REPLACE FUNCTION get_user_lab_ids(user_uuid UUID)
RETURNS TABLE(lab_id UUID) AS $$
BEGIN
  -- Si es super admin o revisor global, retornar todos los labs activos
  IF is_super_admin(user_uuid) OR is_global_reviewer(user_uuid) THEN
    RETURN QUERY SELECT id FROM labs WHERE status = 'active';
  END IF;

  -- Labs como miembro
  RETURN QUERY
  SELECT DISTINCT lm.lab_id
  FROM lab_members lm
  WHERE lm.user_id = user_uuid
  
  UNION
  
  -- Labs como revisor asignado específico
  SELECT DISTINCT lra.lab_id
  FROM lab_reviewer_assignments lra
  WHERE lra.reviewer_user_id = user_uuid AND lra.active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Agregar política para que revisores globales vean todos los labs
DROP POLICY IF EXISTS "Revisores globales pueden ver todos los labs" ON labs;

CREATE POLICY "Revisores globales pueden ver todos los labs"
  ON labs FOR SELECT
  USING (is_global_reviewer(auth.uid()));

-- 4. Verificar que el usuario tenga el rol correcto
SELECT 
  p.user_id, 
  p.full_name, 
  p.email, 
  p.role as profile_role,
  (SELECT string_agg(lm.role, ', ') FROM lab_members lm WHERE lm.user_id = p.user_id) as lab_member_roles
FROM profiles p
WHERE p.role = 'reviewer';

-- 5. Verificar labs activos disponibles
SELECT id, name, status FROM labs WHERE status = 'active';
