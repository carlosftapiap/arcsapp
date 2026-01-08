-- =====================================================
-- ARCSAPP - DATOS DE PRUEBA (SEED)
-- =====================================================

-- NOTA: Ejecutar después de las migraciones principales

-- =====================================================
-- CREAR SUPER ADMIN
-- =====================================================
-- Primero crear usuario en Supabase Auth (esto se hace desde el dashboard)
-- Email: admin@arcsapp.com
-- Password: Admin123! (cambiar en producción)
-- UUID esperado: se insertará después de crear el usuario

-- Insertar perfil del super admin
-- NOTA: Reemplazar 'UUID-DEL-SUPER-ADMIN' con el UUID real del usuario creado
INSERT INTO profiles (user_id, full_name, email, locale)
VALUES 
  ('c7912dbe-77ff-4273-aa07-60b430601344', 'Super Administrador', 'admin@arcsapp.com', 'es')
ON CONFLICT (user_id) DO NOTHING;

-- Asignar rol de super_admin (sin lab específico al inicio)
-- El super_admin puede crear un lab dummy para cumplir la constraint
INSERT INTO labs (id, name, ruc, status)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sistema', 'SYSTEM', 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO lab_members (lab_id, user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'c7912dbe-77ff-4273-aa07-60b430601344', 'super_admin')
ON CONFLICT (lab_id, user_id, role) DO NOTHING;

-- =====================================================
-- LABORATORIO DEMO
-- =====================================================
INSERT INTO labs (id, name, ruc, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Laboratorio Farmacéutico Demo', '20123456789', 'active')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- USUARIO REVISOR DEMO (COMENTADO - OPCIONAL)
-- =====================================================
-- Crear usuario en Supabase Auth:
-- Email: revisor@external.com
-- Password: Revisor123!
-- UUID esperado: se insertará después

-- INSERT INTO profiles (user_id, full_name, email, locale)
-- VALUES 
--   ('UUID-DEL-REVISOR', 'Dr. Carlos Técnico', 'revisor@external.com', 'es')
-- ON CONFLICT (user_id) DO NOTHING;

-- Asignar como revisor del lab demo
-- INSERT INTO lab_reviewer_assignments (lab_id, reviewer_user_id, active)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'UUID-DEL-REVISOR', true)
-- ON CONFLICT (lab_id, reviewer_user_id) DO NOTHING;

-- También crear entrada en lab_members para el revisor
-- INSERT INTO lab_members (lab_id, user_id, role)
-- VALUES 
--   ('11111111-1111-1111-1111-111111111111', 'UUID-DEL-REVISOR', 'reviewer')
-- ON CONFLICT (lab_id, user_id, role) DO NOTHING;

-- =====================================================
-- PLANTILLAS DE CHECKLIST
-- =====================================================

-- Plantilla 1: Medicamento General
INSERT INTO checklist_templates (id, product_type, name, version, active)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'medicine_general', 'Checklist Medicamento General v1', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Ítems para Medicamento General
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order)
VALUES 
  -- Módulo: Documentación Administrativa
  ('a0000000-0000-0000-0000-000000000001', 'MG-01', 'Administrativo', 
   '{"es": "Solicitud de Registro Sanitario", "en": "Health Registration Application", "hi": "स्वास्थ्य पंजीकरण आवेदन", "zh-CN": "健康注册申请"}'::jsonb,
   '{"es": "Formulario oficial de solicitud de registro sanitario debidamente llenado y firmado", "en": "Official health registration application form duly completed and signed", "hi": "आधिकारिक स्वास्थ्य पंजीकरण आवेदन पत्र विधिवत भरा और हस्ताक्षरित", "zh-CN": "正式填写并签署的健康注册申请表"}'::jsonb,
   true, true, 1),
   
  ('a0000000-0000-0000-0000-000000000001', 'MG-02', 'Administrativo',
   '{"es": "Certificado de Libre Venta", "en": "Free Sale Certificate", "hi": "मुक्त बिक्री प्रमाणपत्र", "zh-CN": "自由销售证书"}'::jsonb,
   '{"es": "Certificado de libre venta emitido por autoridad sanitaria del país de origen (apostillado)", "en": "Free sale certificate issued by health authority of country of origin (apostilled)", "hi": "मूल देश के स्वास्थ्य प्राधिकरण द्वारा जारी मुक्त बिक्री प्रमाणपत्र (प्रमाणित)", "zh-CN": "原产国卫生当局签发的自由销售证书（已认证）"}'::jsonb,
   true, true, 2),
   
  -- Módulo: Información Técnica
  ('a0000000-0000-0000-0000-000000000001', 'MG-03', 'Técnico',
   '{"es": "Ficha Técnica del Producto", "en": "Product Technical Data Sheet", "hi": "उत्पाद तकनीकी डेटा शीट", "zh-CN": "产品技术数据表"}'::jsonb,
   '{"es": "Ficha técnica completa del medicamento con composición, indicaciones, contraindicaciones y posología", "en": "Complete technical data sheet with composition, indications, contraindications and dosage", "hi": "संरचना, संकेत, मतभेद और खुराक के साथ पूर्ण तकनीकी डेटा शीट", "zh-CN": "包含成分、适应症、禁忌症和用法用量的完整技术数据表"}'::jsonb,
   true, false, 3),
   
  ('a0000000-0000-0000-0000-000000000001', 'MG-04', 'Técnico',
   '{"es": "Certificado de Análisis del Lote", "en": "Batch Analysis Certificate", "hi": "बैच विश्लेषण प्रमाणपत्र", "zh-CN": "批次分析证书"}'::jsonb,
   '{"es": "Certificado de análisis del fabricante correspondiente al lote piloto o comercial", "en": "Manufacturer certificate of analysis for pilot or commercial batch", "hi": "पायलट या वाणिज्यिक बैच के लिए निर्माता का विश्लेषण प्रमाणपत्र", "zh-CN": "试验批次或商业批次的制造商分析证书"}'::jsonb,
   true, false, 4),
   
  -- Módulo: Fabricante
  ('a0000000-0000-0000-0000-000000000001', 'MG-05', 'Fabricante',
   '{"es": "Certificado GMP del Fabricante", "en": "Manufacturer GMP Certificate", "hi": "निर्माता जीएमपी प्रमाणपत्र", "zh-CN": "制造商GMP证书"}'::jsonb,
   '{"es": "Certificado de Buenas Prácticas de Manufactura (GMP/BPM) vigente del fabricante", "en": "Valid Good Manufacturing Practices (GMP) certificate from manufacturer", "hi": "निर्माता से वैध गुड मैन्युफैक्चरिंग प्रैक्टिसेज (जीएमपी) प्रमाणपत्र", "zh-CN": "制造商有效的良好生产规范（GMP）证书"}'::jsonb,
   true, true, 5)
ON CONFLICT (template_id, code) DO NOTHING;

-- Plantilla 2: Biológico
INSERT INTO checklist_templates (id, product_type, name, version, active)
VALUES 
  ('b0000000-0000-0000-0000-000000000002', 'biologic', 'Checklist Biológico v1', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Ítems para Biológico (similar estructura)
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order)
VALUES 
  ('b0000000-0000-0000-0000-000000000002', 'BIO-01', 'Administrativo',
   '{"es": "Solicitud de Registro Sanitario Biológico", "en": "Biological Health Registration Application", "hi": "जैविक स्वास्थ्य पंजीकरण आवेदन", "zh-CN": "生物制品健康注册申请"}'::jsonb,
   '{"es": "Formulario específico para productos biológicos", "en": "Specific form for biological products", "hi": "जैविक उत्पादों के लिए विशिष्ट फॉर्म", "zh-CN": "生物制品专用表格"}'::jsonb,
   true, true, 1),
   
  ('b0000000-0000-0000-0000-000000000002', 'BIO-02', 'Técnico',
   '{"es": "Datos de Estabilidad", "en": "Stability Data", "hi": "स्थिरता डेटा", "zh-CN": "稳定性数据"}'::jsonb,
   '{"es": "Estudios de estabilidad en condiciones ICH", "en": "Stability studies under ICH conditions", "hi": "आईसीएच शर्तों के तहत स्थिरता अध्ययन", "zh-CN": "ICH条件下的稳定性研究"}'::jsonb,
   true, true, 2),
   
  ('b0000000-0000-0000-0000-000000000002', 'BIO-03', 'Técnico',
   '{"es": "Proceso de Fabricación Biológico", "en": "Biological Manufacturing Process", "hi": "जैविक विनिर्माण प्रक्रिया", "zh-CN": "生物制造工艺"}'::jsonb,
   '{"es": "Descripción detallada del proceso de manufactura biológica", "en": "Detailed description of biological manufacturing process", "hi": "जैविक विनिर्माण प्रक्रिया का विस्तृत विवरण", "zh-CN": "生物制造工艺详细说明"}'::jsonb,
   true, false, 3),
   
  ('b0000000-0000-0000-0000-000000000002', 'BIO-04', 'Calidad',
   '{"es": "Certificado de Control de Calidad", "en": "Quality Control Certificate", "hi": "गुणवत्ता नियंत्रण प्रमाणपत्र", "zh-CN": "质量控制证书"}'::jsonb,
   '{"es": "Certificación de controles de calidad específicos para biológicos", "en": "Certification of biological-specific quality controls", "hi": "जैविक-विशिष्ट गुणवत्ता नियंत्रण का प्रमाणन", "zh-CN": "生物制品特定质量控制认证"}'::jsonb,
   true, false, 4),
   
  ('b0000000-0000-0000-0000-000000000002', 'BIO-05', 'Fabricante',
   '{"es": "Licencia de Fabricante de Biológicos", "en": "Biological Manufacturer License", "hi": "जैविक निर्माता लाइसेंस", "zh-CN": "生物制品制造商许可证"}'::jsonb,
   '{"es": "Licencia vigente para fabricación de productos biológicos", "en": "Valid license for biological product manufacturing", "hi": "जैविक उत्पाद निर्माण के लिए वैध लाइसेंस", "zh-CN": "生物制品制造有效许可证"}'::jsonb,
   true, true, 5)
ON CONFLICT (template_id, code) DO NOTHING;

-- Plantilla 3: Dispositivo Médico
INSERT INTO checklist_templates (id, product_type, name, version, active)
VALUES 
  ('c0000000-0000-0000-0000-000000000003', 'device_medical', 'Checklist Dispositivo Médico v1', 1, true)
ON CONFLICT (id) DO NOTHING;

-- Ítems para Dispositivo Médico
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order)
VALUES 
  ('c0000000-0000-0000-0000-000000000003', 'DM-01', 'Administrativo',
   '{"es": "Solicitud de Registro de Dispositivo Médico", "en": "Medical Device Registration Application", "hi": "चिकित्सा उपकरण पंजीकरण आवेदन", "zh-CN": "医疗器械注册申请"}'::jsonb,
   '{"es": "Formulario de solicitud para dispositivos médicos", "en": "Application form for medical devices", "hi": "चिकित्सा उपकरणों के लिए आवेदन पत्र", "zh-CN": "医疗器械申请表"}'::jsonb,
   true, true, 1),
   
  ('c0000000-0000-0000-0000-000000000003', 'DM-02', 'Técnico',
   '{"es": "Certificado CE o FDA", "en": "CE or FDA Certificate", "hi": "सीई या एफडीए प्रमाणपत्र", "zh-CN": "CE或FDA证书"}'::jsonb,
   '{"es": "Certificación CE (Europa) o FDA (USA) del dispositivo médico", "en": "CE (Europe) or FDA (USA) certification of medical device", "hi": "चिकित्सा उपकरण का सीई (यूरोप) या एफडीए (यूएसए) प्रमाणन", "zh-CN": "医疗器械CE（欧洲）或FDA（美国）认证"}'::jsonb,
   true, true, 2),
   
  ('c0000000-0000-0000-0000-000000000003', 'DM-03', 'Técnico',
   '{"es": "Manual de Usuario", "en": "User Manual", "hi": "उपयोगकर्ता मैनुअल", "zh-CN": "用户手册"}'::jsonb,
   '{"es": "Manual de instrucciones en español para el usuario final", "en": "User instruction manual in Spanish", "hi": "स्पेनिश में उपयोगकर्ता निर्देश मैनुअल", "zh-CN": "西班牙语用户说明手册"}'::jsonb,
   true, false, 3),
   
  ('c0000000-0000-0000-0000-000000000003', 'DM-04', 'Calidad',
   '{"es": "Certificado ISO 13485", "en": "ISO 13485 Certificate", "hi": "आईएसओ 13485 प्रमाणपत्र", "zh-CN": "ISO 13485证书"}'::jsonb,
   '{"es": "Certificación ISO 13485 del sistema de gestión de calidad", "en": "ISO 13485 quality management system certification", "hi": "आईएसओ 13485 गुणवत्ता प्रबंधन प्रणाली प्रमाणन", "zh-CN": "ISO 13485质量管理体系认证"}'::jsonb,
   true, false, 4),
   
  ('c0000000-0000-0000-0000-000000000003', 'DM-05', 'Fabricante',
   '{"es": "Licencia del Fabricante", "en": "Manufacturer License", "hi": "निर्माता लाइसेंस", "zh-CN": "制造商许可证"}'::jsonb,
   '{"es": "Licencia o autorización sanitaria del fabricante", "en": "Manufacturer health license or authorization", "hi": "निर्माता स्वास्थ्य लाइसेंस या प्राधिकरण", "zh-CN": "制造商卫生许可证或授权"}'::jsonb,
   true, true, 5)
ON CONFLICT (template_id, code) DO NOTHING;

-- =====================================================
-- DOSSIER DEMO (COMENTADO - OPCIONAL)
-- =====================================================
-- INSERT INTO dossiers (id, lab_id, product_type, product_name, origin, status, created_by)
-- VALUES 
--   ('d0000000-0000-0000-0000-000000000001', 
--    '11111111-1111-1111-1111-111111111111', 
--    'medicine_general', 
--    'Paracetamol 500mg Tabletas', 
--    'imported', 
--    'in_progress',
--    'UUID-DEL-USUARIO-LAB-DEMO')
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- NOTAS FINALES
-- =====================================================
-- 1. Reemplazar UUIDs de usuarios con los reales después de crearlos en Supabase Auth
-- 2. Este seed es para desarrollo/testing
-- 3. En producción, crear super_admin de forma segura
-- 4. Las contraseñas deben cambiarse inmediatamente en producción
