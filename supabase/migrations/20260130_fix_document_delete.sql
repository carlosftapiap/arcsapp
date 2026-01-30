-- Permissions to DELETE documents (which was missing in previous RLS overrides)

-- 1. Create DELETE policy
CREATE POLICY "Lab uploaders can delete documents" ON documents
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM dossier_items di
    JOIN dossiers d ON di.dossier_id = d.id
    JOIN lab_members lm ON lm.lab_id = d.lab_id
    WHERE di.id = documents.dossier_item_id
    AND lm.user_id = auth.uid()
    AND lm.role IN ('lab_admin', 'lab_uploader')
  )
  OR
  EXISTS (
      SELECT 1 FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'super_admin'
  )
);

-- 2. Also ensure UPDATE is allowed (for status changes)
CREATE POLICY "Lab uploaders can update documents" ON documents
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM dossier_items di
    JOIN dossiers d ON di.dossier_id = d.id
    JOIN lab_members lm ON lm.lab_id = d.lab_id
    WHERE di.id = documents.dossier_item_id
    AND lm.user_id = auth.uid()
    AND lm.role IN ('lab_admin', 'lab_uploader')
  )
  OR
  EXISTS (
      SELECT 1 FROM lab_members lm
      WHERE lm.user_id = auth.uid() AND lm.role = 'super_admin'
  )
);
