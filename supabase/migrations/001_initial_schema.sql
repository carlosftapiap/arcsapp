-- =====================================================
-- ARCSAPP - ESQUEMA DE BASE DE DATOS
-- Sistema Multi-Tenant para Gestión de Dossiers Regulatorios
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLA: labs (Laboratorios/Empresas - Tenants)
-- =====================================================
CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  ruc VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_labs_status ON labs(status);

-- =====================================================
-- TABLA: profiles (Perfiles de Usuario)
-- =====================================================
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  locale VARCHAR(10) DEFAULT 'es' CHECK (locale IN ('es', 'en', 'hi', 'zh-CN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON profiles(email);

-- =====================================================
-- TABLA: lab_members (Asignación Usuario-Laboratorio)
-- =====================================================
CREATE TABLE lab_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'lab_admin', 'lab_uploader', 'lab_viewer', 'reviewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, user_id, role)
);

CREATE INDEX idx_lab_members_lab ON lab_members(lab_id);
CREATE INDEX idx_lab_members_user ON lab_members(user_id);
CREATE INDEX idx_lab_members_role ON lab_members(role);

-- =====================================================
-- TABLA: lab_reviewer_assignments (Asignación de Revisores)
-- =====================================================
CREATE TABLE lab_reviewer_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lab_id, reviewer_user_id)
);

CREATE INDEX idx_reviewer_assignments_lab ON lab_reviewer_assignments(lab_id);
CREATE INDEX idx_reviewer_assignments_reviewer ON lab_reviewer_assignments(reviewer_user_id);

-- =====================================================
-- TABLA: checklist_templates (Plantillas de Checklist)
-- =====================================================
CREATE TABLE checklist_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical')),
  name VARCHAR(255) NOT NULL,
  version INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_type, version)
);

CREATE INDEX idx_checklist_templates_type ON checklist_templates(product_type);
CREATE INDEX idx_checklist_templates_active ON checklist_templates(active);

-- =====================================================
-- TABLA: checklist_items (Ítems de Plantilla)
-- =====================================================
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  module VARCHAR(100) NOT NULL,
  title_i18n_json JSONB NOT NULL,
  description_i18n_json JSONB,
  required BOOLEAN DEFAULT false,
  critical BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(template_id, code)
);

CREATE INDEX idx_checklist_items_template ON checklist_items(template_id);
CREATE INDEX idx_checklist_items_module ON checklist_items(module);
CREATE INDEX idx_checklist_items_sort ON checklist_items(sort_order);

-- =====================================================
-- TABLA: dossiers (Expedientes Regulatorios)
-- =====================================================
CREATE TABLE dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical')),
  product_name VARCHAR(255) NOT NULL,
  origin VARCHAR(20) CHECK (origin IN ('imported', 'national')),
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'ready', 'submitted')),
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dossiers_lab ON dossiers(lab_id);
CREATE INDEX idx_dossiers_status ON dossiers(status);
CREATE INDEX idx_dossiers_product_type ON dossiers(product_type);

-- =====================================================
-- TABLA: dossier_items (Seguimiento de Checklist por Dossier)
-- =====================================================
CREATE TABLE dossier_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  checklist_item_id UUID NOT NULL REFERENCES checklist_items(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'in_review', 'approved', 'observed')),
  last_reviewed_by UUID REFERENCES profiles(user_id),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dossier_id, checklist_item_id)
);

CREATE INDEX idx_dossier_items_dossier ON dossier_items(dossier_id);
CREATE INDEX idx_dossier_items_status ON dossier_items(status);

-- =====================================================
-- TABLA: documents (Documentos PDF Versionados)
-- =====================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_item_id UUID NOT NULL REFERENCES dossier_items(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  file_path TEXT NOT NULL,
  file_hash VARCHAR(64),
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(user_id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'replaced', 'deleted'))
);

CREATE INDEX idx_documents_dossier_item ON documents(dossier_item_id);
CREATE INDEX idx_documents_version ON documents(version);
CREATE INDEX idx_documents_status ON documents(status);

-- =====================================================
-- TABLA: remarks (Comentarios de Revisión en Checklist)
-- =====================================================
CREATE TABLE remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_item_id UUID NOT NULL REFERENCES dossier_items(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),
  reviewer_user_id UUID NOT NULL REFERENCES profiles(user_id),
  decision VARCHAR(20) NOT NULL CHECK (decision IN ('approved', 'observed')),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_remarks_dossier_item ON remarks(dossier_item_id);
CREATE INDEX idx_remarks_reviewer ON remarks(reviewer_user_id);

-- =====================================================
-- TABLA: extra_documents (Documentos No Listados en Checklist)
-- =====================================================
CREATE TABLE extra_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dossier_id UUID NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  file_path TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  file_hash VARCHAR(64),
  file_size BIGINT,
  uploaded_by UUID REFERENCES profiles(user_id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'replaced', 'deleted'))
);

CREATE INDEX idx_extra_documents_dossier ON extra_documents(dossier_id);
CREATE INDEX idx_extra_documents_status ON extra_documents(status);

-- =====================================================
-- TABLA: extra_remarks (Comentarios en Documentos Extra)
-- =====================================================
CREATE TABLE extra_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extra_document_id UUID NOT NULL REFERENCES extra_documents(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES profiles(user_id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extra_remarks_document ON extra_remarks(extra_document_id);
CREATE INDEX idx_extra_remarks_reviewer ON extra_remarks(reviewer_user_id);

-- =====================================================
-- TABLA: ai_document_reviews (Análisis IA de Documentos)
-- =====================================================
CREATE TABLE ai_document_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doc_scope VARCHAR(20) NOT NULL CHECK (doc_scope IN ('checklist', 'extra')),
  document_id UUID REFERENCES documents(id),
  extra_document_id UUID REFERENCES extra_documents(id),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('openai', 'gemini')),
  model VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'error')),
  result_json JSONB,
  error_message TEXT,
  created_by UUID REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_document_scope CHECK (
    (doc_scope = 'checklist' AND document_id IS NOT NULL AND extra_document_id IS NULL) OR
    (doc_scope = 'extra' AND extra_document_id IS NOT NULL AND document_id IS NULL)
  )
);

CREATE INDEX idx_ai_reviews_document ON ai_document_reviews(document_id);
CREATE INDEX idx_ai_reviews_extra_document ON ai_document_reviews(extra_document_id);
CREATE INDEX idx_ai_reviews_status ON ai_document_reviews(status);

-- =====================================================
-- TABLA: activity_log (Registro de Auditoría)
-- =====================================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID REFERENCES labs(id),
  dossier_id UUID REFERENCES dossiers(id),
  actor_user_id UUID REFERENCES profiles(user_id),
  event_type VARCHAR(100) NOT NULL,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_log_lab ON activity_log(lab_id);
CREATE INDEX idx_activity_log_dossier ON activity_log(dossier_id);
CREATE INDEX idx_activity_log_actor ON activity_log(actor_user_id);
CREATE INDEX idx_activity_log_event ON activity_log(event_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- =====================================================
-- TRIGGERS: Updated At Timestamps
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_labs_updated_at
  BEFORE UPDATE ON labs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dossier_items_updated_at
  BEFORE UPDATE ON dossier_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
