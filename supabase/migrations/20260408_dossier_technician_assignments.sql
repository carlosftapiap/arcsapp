-- Tabla de asignación de técnicos/revisores a dossiers específicos
-- Permite al superadministrador controlar qué carpetas puede ver cada técnica

CREATE TABLE IF NOT EXISTS public.dossier_technician_assignments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dossier_id  UUID NOT NULL REFERENCES public.dossiers(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    active      BOOLEAN DEFAULT TRUE,
    UNIQUE(dossier_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_dta_dossier ON public.dossier_technician_assignments(dossier_id);
CREATE INDEX IF NOT EXISTS idx_dta_user    ON public.dossier_technician_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_dta_active  ON public.dossier_technician_assignments(active);

-- RLS: superadmin puede todo; técnicos solo ven sus propias asignaciones
ALTER TABLE public.dossier_technician_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_full_access" ON public.dossier_technician_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid() AND role = 'super_admin'
        )
    );

CREATE POLICY "users_read_own_assignments" ON public.dossier_technician_assignments
    FOR SELECT USING (user_id = auth.uid());
