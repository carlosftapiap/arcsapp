-- =====================================================
-- ARCSAPP - POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

--Habilitar RLS en todas las tablas
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_reviewer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extra_remarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- HELPER FUNCTION: Verificar si el usuario es super admin
-- =====================================================
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM lab_members
    WHERE user_id = user_uuid AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER FUNCTION: Obtener lab_ids del usuario
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_lab_ids(user_uuid UUID)
RETURNS TABLE(lab_id UUID) AS $$
BEGIN
  -- Si es super admin, retornar todos los labs
  IF is_super_admin(user_uuid) THEN
    RETURN QUERY SELECT id FROM labs;
  END IF;

  -- Labs como miembro
  RETURN QUERY
  SELECT DISTINCT lm.lab_id
  FROM lab_members lm
  WHERE lm.user_id = user_uuid
  
  UNION
  
  -- Labs como revisor asignado
  SELECT DISTINCT lra.lab_id
  FROM lab_reviewer_assignments lra
  WHERE lra.reviewer_user_id = user_uuid AND lra.active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS RLS: labs
-- =====================================================

CREATE POLICY "Super admin puede ver todos los labs"
  ON labs FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Usuarios pueden ver sus labs asignados"
  ON labs FOR SELECT
  USING (id IN (SELECT * FROM get_user_lab_ids(auth.uid())));

CREATE POLICY "Super admin puede insertar labs"
  ON labs FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admin puede actualizar labs"
  ON labs FOR UPDATE
  USING (is_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: profiles
-- =====================================================

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Super admin puede ver todos los perfiles"
  ON profiles FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin puede insertar perfiles"
  ON profiles FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: lab_members
-- =====================================================

CREATE POLICY "Usuarios pueden ver sus propias asignaciones"
  ON lab_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Lab admins pueden ver miembros de su lab"
  ON lab_members FOR SELECT
  USING (
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin')
    )
  );

CREATE POLICY "Super admin puede ver todos los miembros"
  ON lab_members FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admin y lab_admin pueden insertar miembros"
  ON lab_members FOR INSERT
  WITH CHECK (
    is_super_admin(auth.uid()) OR
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'lab_admin'
    )
  );

CREATE POLICY "Super admin y lab_admin pueden eliminar miembros"
  ON lab_members FOR DELETE
  USING (
    is_super_admin(auth.uid()) OR
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'lab_admin'
    )
  );

-- =====================================================
-- POLÍTICAS RLS: lab_reviewer_assignments
-- =====================================================

CREATE POLICY "Super admin puede ver todas las asignaciones de revisores"
  ON lab_reviewer_assignments FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Revisores pueden ver sus asignaciones"
  ON lab_reviewer_assignments FOR SELECT
  USING (reviewer_user_id = auth.uid());

CREATE POLICY "Super admin puede insertar/actualizar asignaciones"
  ON lab_reviewer_assignments FOR ALL
  USING (is_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: checklist_templates
-- =====================================================

CREATE POLICY "Todos los usuarios autenticados pueden ver templates activos"
  ON checklist_templates FOR SELECT
  USING (active = true OR is_super_admin(auth.uid()));

CREATE POLICY "Super admin puede gestionar templates"
  ON checklist_templates FOR ALL
  USING (is_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: checklist_items
-- =====================================================

CREATE POLICY "Usuarios pueden ver items de templates activos"
  ON checklist_items FOR SELECT
  USING (
    template_id IN (SELECT id FROM checklist_templates WHERE active = true)
    OR is_super_admin(auth.uid())
  );

CREATE POLICY "Super admin puede gestionar items"
  ON checklist_items FOR ALL
  USING (is_super_admin(auth.uid()));

-- =====================================================
-- POLÍTICAS RLS: dossiers
-- =====================================================

CREATE POLICY "Usuarios pueden ver dossiers de sus labs"
  ON dossiers FOR SELECT
  USING (lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid())));

CREATE POLICY "Lab members pueden crear dossiers"
  ON dossiers FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

CREATE POLICY "Lab members pueden actualizar dossiers"
  ON dossiers FOR UPDATE
  USING (
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

-- =====================================================
-- POLÍTICAS RLS: dossier_items
-- =====================================================

CREATE POLICY "Usuarios pueden ver items de dossiers accesibles"
  ON dossier_items FOR SELECT
  USING (
    dossier_id IN (
      SELECT id FROM dossiers
      WHERE lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

CREATE POLICY "Lab members pueden insertar/actualizar items"
  ON dossier_items FOR ALL
  USING (
    dossier_id IN (
      SELECT d.id FROM dossiers d
      INNER JOIN lab_members lm ON lm.lab_id = d.lab_id
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader', 'reviewer')
    )
  );

-- =====================================================
-- POLÍTICAS RLS: documents
-- =====================================================

CREATE POLICY "Usuarios pueden ver documentos de dossiers accesibles"
  ON documents FOR SELECT
  USING (
    dossier_item_id IN (
      SELECT di.id FROM dossier_items di
      INNER JOIN dossiers d ON d.id = di.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

CREATE POLICY "Lab uploaders pueden insertar documentos"
  ON documents FOR INSERT
  WITH CHECK (
    dossier_item_id IN (
      SELECT di.id FROM dossier_items di
      INNER JOIN dossiers d ON d.id = di.dossier_id
      INNER JOIN lab_members lm ON lm.lab_id = d.lab_id
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

CREATE POLICY "Lab uploaders pueden actualizar/eliminar documentos"
  ON documents FOR ALL
  USING (
    dossier_item_id IN (
      SELECT di.id FROM dossier_items di
      INNER JOIN dossiers d ON d.id = di.dossier_id
      INNER JOIN lab_members lm ON lm.lab_id = d.lab_id
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

-- =====================================================
-- POLÍTICAS RLS: remarks
-- =====================================================

CREATE POLICY "Usuarios pueden ver remarks de dossiers accesibles"
  ON remarks FOR SELECT
  USING (
    dossier_item_id IN (
      SELECT di.id FROM dossier_items di
      INNER JOIN dossiers d ON d.id = di.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

CREATE POLICY "Revisores pueden crear remarks"
  ON remarks FOR INSERT
  WITH CHECK (
    dossier_item_id IN (
      SELECT di.id FROM dossier_items di
      INNER JOIN dossiers d ON d.id = di.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
    AND reviewer_user_id = auth.uid()
  );

-- =====================================================
-- POLÍTICAS RLS: extra_documents
-- =====================================================

CREATE POLICY "Usuarios pueden ver documentos extra de dossiers accesibles"
  ON extra_documents FOR SELECT
  USING (
    dossier_id IN (
      SELECT id FROM dossiers
      WHERE lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

CREATE POLICY "Lab uploaders pueden gestionar documentos extra"
  ON extra_documents FOR ALL
  USING (
    dossier_id IN (
      SELECT d.id FROM dossiers d
      INNER JOIN lab_members lm ON lm.lab_id = d.lab_id
      WHERE lm.user_id = auth.uid() AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

-- =====================================================
-- POLÍTICAS RLS: extra_remarks
-- =====================================================

CREATE POLICY "Usuarios pueden ver remarks extra de dossiers accesibles"
  ON extra_remarks FOR SELECT
  USING (
    extra_document_id IN (
      SELECT ed.id FROM extra_documents ed
      INNER JOIN dossiers d ON d.id = ed.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
  );

CREATE POLICY "Revisores pueden crear remarks extra"
  ON extra_remarks FOR INSERT
  WITH CHECK (
    extra_document_id IN (
      SELECT ed.id FROM extra_documents ed
      INNER JOIN dossiers d ON d.id = ed.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    )
    AND reviewer_user_id = auth.uid()
  );

-- =====================================================
-- POLÍTICAS RLS: ai_document_reviews
-- =====================================================

CREATE POLICY "Usuarios pueden ver análisis IA de sus documentos"
  ON ai_document_reviews FOR SELECT
  USING (
    (doc_scope = 'checklist' AND document_id IN (
      SELECT doc.id FROM documents doc
      INNER JOIN dossier_items di ON di.id = doc.dossier_item_id
      INNER JOIN dossiers d ON d.id = di.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    ))
    OR
    (doc_scope = 'extra' AND extra_document_id IN (
      SELECT ed.id FROM extra_documents ed
      INNER JOIN dossiers d ON d.id = ed.dossier_id
      WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
    ))
  );

CREATE POLICY "Usuarios autorizados pueden crear análisis IA"
  ON ai_document_reviews FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    (
      (doc_scope = 'checklist' AND document_id IN (
        SELECT doc.id FROM documents doc
        INNER JOIN dossier_items di ON di.id = doc.dossier_item_id
        INNER JOIN dossiers d ON d.id = di.dossier_id
        WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
      ))
      OR
      (doc_scope = 'extra' AND extra_document_id IN (
        SELECT ed.id FROM extra_documents ed
        INNER JOIN dossiers d ON d.id = ed.dossier_id
        WHERE d.lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid()))
      ))
    )
  );

-- =====================================================
-- POLÍTICAS RLS: activity_log
-- =====================================================

CREATE POLICY "Usuarios pueden ver activity log de sus labs"
  ON activity_log FOR SELECT
  USING (lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid())));

CREATE POLICY "Usuarios autenticados pueden insertar activity log"
  ON activity_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
