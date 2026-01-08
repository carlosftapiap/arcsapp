-- =====================================================
-- ARCSAPP - MIGRACIÓN: Tabla de Productos
-- =====================================================

-- TABLA: products (Productos del Laboratorio)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_id UUID NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('medicine_general', 'device_medical')),
  nombre_comercial VARCHAR(255) NOT NULL,
  principio_activo VARCHAR(255),
  forma_farmaceutica VARCHAR(100),
  concentracion VARCHAR(100),
  via_administracion VARCHAR(100),
  presentacion VARCHAR(255),
  origen VARCHAR(20) CHECK (origen IN ('imported', 'national')),
  fabricante VARCHAR(255),
  titular VARCHAR(255),
  pais_origen VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_lab ON products(lab_id);
CREATE INDEX idx_products_type ON products(product_type);

-- Trigger para updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Añadir columna product_id a dossiers (para vincular el producto)
ALTER TABLE dossiers 
  ADD COLUMN product_id UUID REFERENCES products(id) ON DELETE SET NULL;

CREATE INDEX idx_dossiers_product ON dossiers(product_id);

-- Añadir columna country a labs
ALTER TABLE labs
  ADD COLUMN country VARCHAR(100);

-- =====================================================
-- POLÍTICAS RLS PARA PRODUCTS
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Usuarios pueden ver productos de sus labs
CREATE POLICY "Usuarios pueden ver productos de sus labs"
  ON products FOR SELECT
  USING (lab_id IN (SELECT * FROM get_user_lab_ids(auth.uid())));

-- Lab admin y uploader pueden crear productos
CREATE POLICY "Lab members pueden crear productos"
  ON products FOR INSERT
  WITH CHECK (
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() 
      AND lm.role IN ('super_admin', 'lab_admin', 'lab_uploader')
    )
  );

-- Lab admin pueden actualizar productos
CREATE POLICY "Lab admin pueden actualizar productos"
  ON products FOR UPDATE
  USING (
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() 
      AND lm.role IN ('super_admin', 'lab_admin')
    )
  );

-- Lab admin pueden eliminar productos
CREATE POLICY "Lab admin pueden eliminar productos"
  ON products FOR DELETE
  USING (
    lab_id IN (
      SELECT lm.lab_id FROM lab_members lm
      WHERE lm.user_id = auth.uid() 
      AND lm.role IN ('super_admin', 'lab_admin')
    )
  );
