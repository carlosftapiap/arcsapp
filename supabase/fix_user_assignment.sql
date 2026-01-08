-- =====================================================
-- ARCSAPP - FIX: Asignar Super Admin a Labs
-- =====================================================

-- Verificar estado actual
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  lm.lab_id,
  lm.role,
  l.name as lab_name
FROM auth.users u
LEFT JOIN profiles p ON p.user_id = u.id
LEFT JOIN lab_members lm ON lm.user_id = u.id
LEFT JOIN labs l ON l.id = lm.lab_id
WHERE u.email = 'admin@arcsapp.com';

-- Si no aparece nada en lab_id, ejecutar esto:

-- Asignar super admin al lab Sistema
INSERT INTO lab_members (lab_id, user_id, role)
SELECT 
  '00000000-0000-0000-0000-000000000001',
  user_id,
  'super_admin'
FROM profiles
WHERE email = 'admin@arcsapp.com'
ON CONFLICT (lab_id, user_id, role) DO NOTHING;

-- Verificar de nuevo
SELECT 
  u.email,
  lm.role,
  l.name as lab_name
FROM auth.users u
JOIN profiles p ON p.user_id = u.id
JOIN lab_members lm ON lm.user_id = u.id
JOIN labs l ON l.id = lm.lab_id
WHERE u.email = 'admin@arcsapp.com';
