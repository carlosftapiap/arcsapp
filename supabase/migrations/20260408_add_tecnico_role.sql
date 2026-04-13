-- Agregar el rol 'tecnico' como valor válido en profiles
-- Si existe una constraint CHECK en la columna role, actualizarla

DO $$
BEGIN
    -- Intentar eliminar constraint existente si existe
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

    -- Agregar constraint actualizada con el nuevo rol
    ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_role_check
        CHECK (role IN ('super_admin', 'lab_admin', 'lab_uploader', 'lab_viewer', 'reviewer', 'tecnico', 'viewer'));
EXCEPTION
    WHEN others THEN
        -- Si no hay constraint, simplemente continuar
        NULL;
END $$;
