-- Script simplificado para agregar columna 'role' a profiles
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna role
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'viewer';

-- 2. Actualizar el Super Admin existente
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'admin@arcsapp.com';

-- 3. Actualizar roles desde lab_members para usuarios existentes
UPDATE profiles p
SET role = (
    SELECT lm.role 
    FROM lab_members lm 
    WHERE lm.user_id = p.user_id 
    LIMIT 1
)
WHERE EXISTS (
    SELECT 1 FROM lab_members lm WHERE lm.user_id = p.user_id
);

-- 4. Verificar resultado
SELECT user_id, full_name, email, role FROM profiles;
