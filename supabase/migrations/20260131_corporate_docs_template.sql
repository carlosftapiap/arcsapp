-- =====================================================
-- MIGRACIÓN: Agregar Plantilla "Documentación Corporativa" (Sin DO block)
-- =====================================================

-- 1. Actualizar constraints de product_type para incluir 'corporate_docs'
-- ---------------------------------------------------------------------

-- Tabla products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food', 'corporate_docs'));

-- Tabla dossiers
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_product_type_check;
ALTER TABLE dossiers ADD CONSTRAINT dossiers_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food', 'corporate_docs'));

-- Tabla checklist_templates
ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_product_type_check;
ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food', 'corporate_docs'));


-- 2. Crear la Plantilla (Usando UUID conocido para evitar variables)
-- UUID generado: d0e80e64-c2c7-4384-b816-5387e14d4e0e
-- ---------------------------------------------------------------------
INSERT INTO checklist_templates (id, product_type, name, version, active, created_at)
VALUES (
    'd0e80e64-c2c7-4384-b816-5387e14d4e0e',
    'corporate_docs',
    'Documentación Corporativa Evophar',
    1,
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Items (Grupos por módulo)
-- Módulo 1: Corporativo
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LEG-01', 'Corporativo', 
'{"es": "Registro Mercantil, RUC, Estatutos", "en": "Commercial Registry, RUC, Bylaws"}',
'{"es": "Documentación institucional y operativa clave de la empresa."}', 
true, true, 10),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LEG-02', 'Corporativo', 
'{"es": "Poderes Legales", "en": "Power of Attorneys"}',
'{"es": "Poderes legales del representante (Carlos Tapia)."}', 
true, true, 20),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LEG-03', 'Corporativo', 
'{"es": "Certificados Bancarios", "en": "Bank Certificates"}',
'{"es": "Referencias y certificados bancarios actualizados."}', 
true, true, 30),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LEG-04', 'Corporativo', 
'{"es": "Firma Electrónica y Credenciales", "en": "Electronic Signature and Credentials"}',
'{"es": "Archivos de firma electrónica y accesos seguros."}', 
true, true, 40),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LEG-05', 'Corporativo', 
'{"es": "Manuales y Políticas Internas", "en": "Internal Manuals and Policies"}',
'{"es": "Manuales internos, políticas de calidad y protocolos administrativos."}', 
false, true, 50);

-- Módulo 2: Proveedores
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'PRO-01', 'Proveedores', 
'{"es": "Contratos Firmados", "en": "Signed Contracts"}',
'{"es": "Contratos con Grupo Alde, Doctivo, Wexford, etc."}', 
true, true, 100),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'PRO-02', 'Proveedores', 
'{"es": "Anexos Comerciales y Precios", "en": "Commercial Annexes and Pricing"}',
'{"es": "FOB, volúmenes, exclusividad, listado de productos."}', 
true, true, 110),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'PRO-03', 'Proveedores', 
'{"es": "Condiciones de Despacho y Logística", "en": "Shipping and Logistics Conditions"}',
'{"es": "Condiciones de pago, logística y coordinación."}', 
false, true, 120),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'PRO-04', 'Proveedores', 
'{"es": "Comunicaciones Estratégicas", "en": "Strategic Communications"}',
'{"es": "Emails clave, negociaciones, cronogramas, minutas (Alde, Doctivo, Wexford)."}', 
false, true, 130);

-- Módulo 3: Regulatorio
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'REG-01', 'Regulatorio', 
'{"es": "Checklists ARCSA por Categoría", "en": "ARCSA Category Checklists"}',
'{"es": "Checklists actualizados (inyectables, comprimidos, etc)."}', 
false, true, 200),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'REG-02', 'Regulatorio', 
'{"es": "Normativa y Requisitos ARCSA 2024-2026", "en": "ARCSA Requirements 2024-2026"}',
'{"es": "Documentos de requisitos actualizados."}', 
false, true, 210),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'REG-03', 'Regulatorio', 
'{"es": "Plantillas Modelo y Formatos", "en": "Model Templates and Standard Forms"}',
'{"es": "Modelos de poderes, declaraciones, formatos estándar."}', 
false, true, 220),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'REG-04', 'Regulatorio', 
'{"es": "Cronograma Maestro de Registros", "en": "Registration Master Schedule"}',
'{"es": "Planificación de registros por laboratorio."}', 
true, true, 230),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'REG-05', 'Regulatorio', 
'{"es": "Informes de Auditoría Previa", "en": "Pre-Audit Reports"}',
'{"es": "Resumen por producto antes de envío a ARCSA."}', 
false, true, 240);

-- Módulo 4: Comercial
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'MKT-01', 'Comercial', 
'{"es": "Catálogos y Brochures", "en": "Catalogs and Brochures"}',
'{"es": "PDFs y material visual de Wexford, Doctivo, etc."}', 
false, true, 300),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'MKT-02', 'Comercial', 
'{"es": "Listado Maestro de Productos (SKU)", "en": "Master Product List (SKU)"}',
'{"es": "Listado actualizado con presentaciones."}', 
true, false, 310),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'MKT-03', 'Comercial', 
'{"es": "Presentaciones Institucionales", "en": "Institutional Presentations"}',
'{"es": "Pitch decks y presentaciones corporativas."}', 
false, true, 320),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'MKT-04', 'Comercial', 
'{"es": "Estrategias de Marketing", "en": "Marketing Strategies"}',
'{"es": "Posicionamiento, campañas, materiales aprobados."}', 
false, true, 330);

-- Módulo 5: Logística
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LOG-01', 'Logística', 
'{"es": "Contratos Operadores Logísticos", "en": "Logistics Operator Contracts"}',
'{"es": "Convenios con operadores locales."}', 
true, true, 400),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LOG-02', 'Logística', 
'{"es": "Documentos de Embarque (Importación)", "en": "Shipping Documents"}',
'{"es": "BL, AWB, Packing Lists."}', 
true, true, 410),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LOG-03', 'Logística', 
'{"es": "Tarifarios y Costos Logísticos", "en": "Logistics Tariffs"}',
'{"es": "Transporte, aduana, almacenamiento."}', 
false, true, 420),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'LOG-04', 'Logística', 
'{"es": "Seguimiento de Órdenes", "en": "Order Tracking"}',
'{"es": "Reportes de entregas y ciclos logísticos."}', 
false, true, 430);

-- Módulo 6: Finanzas
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'FIN-01', 'Finanzas', 
'{"es": "Órdenes de Compra", "en": "Purchase Orders"}',
'{"es": "OC emitidas y recibidas."}', 
true, true, 500),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'FIN-02', 'Finanzas', 
'{"es": "Facturas", "en": "Invoices"}',
'{"es": "Facturas por proveedor / producto / embarque."}', 
true, true, 510),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'FIN-03', 'Finanzas', 
'{"es": "Cronogramas de Pago", "en": "Payment Schedules"}',
'{"es": "Condiciones y fechas de pago por socio."}', 
true, true, 520),

(gen_random_uuid(), 'd0e80e64-c2c7-4384-b816-5387e14d4e0e', 'FIN-04', 'Finanzas', 
'{"es": "Reportes Financieros", "en": "Financial Reports"}',
'{"es": "Costos, márgenes, proyecciones."}', 
false, true, 530);
