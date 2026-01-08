-- Migration: Expand B-01 into sub-items and enable multi-file for ALL items
-- B1 is a FOLDER with multiple document types, not a single file

-- =====================================================
-- 1. ADD AI KEYWORDS COLUMN FOR CLASSIFICATION
-- =====================================================
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS ai_keywords TEXT[];

COMMENT ON COLUMN checklist_items.ai_keywords IS 
'Array of keywords that AI uses to auto-classify documents. E.g., ["manufacturing process", "blending", "mixing"] for B-01.2';

-- =====================================================
-- 2. SET ALL ITEMS TO ALLOW MULTIPLE FILES
-- =====================================================
UPDATE checklist_items SET allows_multiple_files = true;

COMMENT ON COLUMN checklist_items.allows_multiple_files IS 
'All items now allow multiple files. Each stage is treated as a folder that can contain multiple documents.';

-- =====================================================
-- 3. EXPAND B-01 INTO SUB-ITEMS (B-01.1 to B-01.6)
-- =====================================================

-- First, get the template_id for medicine_general (most common)
-- We'll add sub-items for all templates that have a B-01

-- For medicine_general template (assuming it exists with B-01 style codes)
-- Insert new sub-items based on B-01 parent

-- B-01.1: Descripción del Producto
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order, allows_multiple_files, ai_keywords)
SELECT 
    template_id,
    'B-01.1',
    module,
    '{"es": "Descripción del Producto", "en": "Product Description", "hi": "उत्पाद विवरण", "zh-CN": "产品描述"}'::jsonb,
    '{"es": "Descripción física, química y farmacéutica del producto terminado", "en": "Physical, chemical and pharmaceutical description of finished product", "hi": "तैयार उत्पाद का भौतिक, रासायनिक और फार्मास्युटिकल विवरण", "zh-CN": "成品的物理、化学和药学描述"}'::jsonb,
    true,
    false,
    (SELECT sort_order FROM checklist_items ci2 WHERE ci2.code = 'B-01' AND ci2.template_id = checklist_items.template_id LIMIT 1) + 0.1,
    true,
    ARRAY['product description', 'physical description', 'chemical description', 'pharmaceutical description', 'finished product', 'descripción', 'producto terminado']
FROM checklist_items 
WHERE code = 'B-01'
ON CONFLICT (template_id, code) DO NOTHING;

-- B-01.2: Proceso de Fabricación
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order, allows_multiple_files, ai_keywords)
SELECT 
    template_id,
    'B-01.2',
    module,
    '{"es": "Proceso de Fabricación", "en": "Manufacturing Process", "hi": "निर्माण प्रक्रिया", "zh-CN": "生产工艺"}'::jsonb,
    '{"es": "Descripción detallada del proceso de manufactura paso a paso", "en": "Detailed step-by-step manufacturing process description", "hi": "चरण-दर-चरण विनिर्माण प्रक्रिया का विस्तृत विवरण", "zh-CN": "详细的逐步生产工艺说明"}'::jsonb,
    true,
    false,
    (SELECT sort_order FROM checklist_items ci2 WHERE ci2.code = 'B-01' AND ci2.template_id = checklist_items.template_id LIMIT 1) + 0.2,
    true,
    ARRAY['manufacturing process', 'process description', 'blending', 'mixing', 'drying', 'granulation', 'compression', 'coating', 'proceso de fabricación', 'manufactura', 'mezclado', 'secado']
FROM checklist_items 
WHERE code = 'B-01'
ON CONFLICT (template_id, code) DO NOTHING;

-- B-01.3: Fórmula Cuali-Cuantitativa
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order, allows_multiple_files, ai_keywords)
SELECT 
    template_id,
    'B-01.3',
    module,
    '{"es": "Fórmula Cuali-Cuantitativa", "en": "Quali-Quantitative Formula", "hi": "गुणात्मक-मात्रात्मक सूत्र", "zh-CN": "定性定量配方"}'::jsonb,
    '{"es": "Composición completa con cantidades de cada ingrediente activo y excipiente", "en": "Complete composition with quantities of each active ingredient and excipient", "hi": "प्रत्येक सक्रिय संघटक और एक्सीपिएंट की मात्रा के साथ पूर्ण संरचना", "zh-CN": "包含每种活性成分和赋形剂数量的完整组成"}'::jsonb,
    true,
    true,
    (SELECT sort_order FROM checklist_items ci2 WHERE ci2.code = 'B-01' AND ci2.template_id = checklist_items.template_id LIMIT 1) + 0.3,
    true,
    ARRAY['formula', 'composition', 'quali-quantitative', 'excipients', 'active ingredient', 'API', 'fórmula', 'composición', 'excipientes', 'principio activo', 'ingredients']
FROM checklist_items 
WHERE code = 'B-01'
ON CONFLICT (template_id, code) DO NOTHING;

-- B-01.4: Controles en Proceso (IPC)
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order, allows_multiple_files, ai_keywords)
SELECT 
    template_id,
    'B-01.4',
    module,
    '{"es": "Controles en Proceso (IPC)", "en": "In-Process Controls (IPC)", "hi": "प्रक्रिया नियंत्रण (IPC)", "zh-CN": "过程控制（IPC）"}'::jsonb,
    '{"es": "Parámetros y límites de control durante el proceso de fabricación", "en": "Control parameters and limits during manufacturing process", "hi": "विनिर्माण प्रक्रिया के दौरान नियंत्रण पैरामीटर और सीमाएं", "zh-CN": "生产过程中的控制参数和限值"}'::jsonb,
    true,
    false,
    (SELECT sort_order FROM checklist_items ci2 WHERE ci2.code = 'B-01' AND ci2.template_id = checklist_items.template_id LIMIT 1) + 0.4,
    true,
    ARRAY['in-process control', 'IPC', 'control parameters', 'process control', 'controles en proceso', 'parámetros', 'límites', 'control de proceso']
FROM checklist_items 
WHERE code = 'B-01'
ON CONFLICT (template_id, code) DO NOTHING;

-- B-01.5: Flujograma de Proceso
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order, allows_multiple_files, ai_keywords)
SELECT 
    template_id,
    'B-01.5',
    module,
    '{"es": "Flujograma de Proceso", "en": "Process Flowchart", "hi": "प्रक्रिया फ़्लोचार्ट", "zh-CN": "工艺流程图"}'::jsonb,
    '{"es": "Diagrama visual del flujo de proceso de fabricación", "en": "Visual diagram of manufacturing process flow", "hi": "विनिर्माण प्रक्रिया प्रवाह का दृश्य आरेख", "zh-CN": "生产工艺流程视觉图"}'::jsonb,
    true,
    false,
    (SELECT sort_order FROM checklist_items ci2 WHERE ci2.code = 'B-01' AND ci2.template_id = checklist_items.template_id LIMIT 1) + 0.5,
    true,
    ARRAY['flowchart', 'process flow', 'flow diagram', 'manufacturing flow', 'flujograma', 'diagrama de flujo', 'flujo de proceso']
FROM checklist_items 
WHERE code = 'B-01'
ON CONFLICT (template_id, code) DO NOTHING;

-- B-01.6: Overages / Pérdidas
INSERT INTO checklist_items (template_id, code, module, title_i18n_json, description_i18n_json, required, critical, sort_order, allows_multiple_files, ai_keywords)
SELECT 
    template_id,
    'B-01.6',
    module,
    '{"es": "Overages / Pérdidas", "en": "Overages / Losses", "hi": "ओवरेज / हानि", "zh-CN": "超量/损耗"}'::jsonb,
    '{"es": "Justificación de sobredosificaciones o compensación de pérdidas en proceso", "en": "Justification for overdosing or compensation for process losses", "hi": "ओवरडोज़िंग या प्रक्रिया हानि के मुआवजे का औचित्य", "zh-CN": "超量投料或工艺损耗补偿的说明"}'::jsonb,
    false,
    false,
    (SELECT sort_order FROM checklist_items ci2 WHERE ci2.code = 'B-01' AND ci2.template_id = checklist_items.template_id LIMIT 1) + 0.6,
    true,
    ARRAY['overage', 'losses', 'overdosing', 'compensation', 'excess', 'sobredosificación', 'pérdidas', 'compensación', 'exceso']
FROM checklist_items 
WHERE code = 'B-01'
ON CONFLICT (template_id, code) DO NOTHING;

-- =====================================================
-- 4. UPDATE AI KEYWORDS FOR EXISTING ITEMS
-- =====================================================

-- A-01: GMP Certificate
UPDATE checklist_items SET ai_keywords = ARRAY[
    'GMP', 'BPM', 'good manufacturing', 'buenas prácticas', 'manufacturing certificate', 
    'certificado GMP', 'certificate of compliance', 'WHO GMP', 'PIC/S'
] WHERE code = 'A-01';

-- A-02: CPP / Free Sale
UPDATE checklist_items SET ai_keywords = ARRAY[
    'CPP', 'certificate pharmaceutical product', 'free sale', 'libre venta', 
    'WHO certificate', 'marketing authorization', 'autorización de comercialización'
] WHERE code = 'A-02';

-- A-03: Holder Declaration
UPDATE checklist_items SET ai_keywords = ARRAY[
    'declaration', 'declaración', 'regulatory status', 'holder', 'titular', 
    'sworn statement', 'declaración jurada', 'international status'
] WHERE code = 'A-03';

-- A-04: Power of Attorney
UPDATE checklist_items SET ai_keywords = ARRAY[
    'power of attorney', 'poder', 'legal representative', 'representante legal', 
    'authorization', 'autorización', 'notarized', 'notariado', 'apoderado'
] WHERE code = 'A-04';

-- B-01: Finished Product CoA (parent - now with sub-items)
UPDATE checklist_items SET ai_keywords = ARRAY[
    'CoA', 'certificate of analysis', 'certificado de análisis', 'finished product', 
    'producto terminado', 'batch analysis', 'análisis de lote', 'release testing'
] WHERE code = 'B-01';

-- B-02: Raw Materials / API CoA
UPDATE checklist_items SET ai_keywords = ARRAY[
    'raw material', 'materia prima', 'API', 'active pharmaceutical ingredient', 
    'principio activo', 'excipient CoA', 'supplier certificate', 'certificado proveedor'
] WHERE code = 'B-02';

-- C-01: Stability Studies
UPDATE checklist_items SET ai_keywords = ARRAY[
    'stability', 'estabilidad', 'ICH', 'accelerated', 'acelerada', 'long term', 
    'largo plazo', 'shelf life', 'vida útil', 'degradation', 'degradación'
] WHERE code = 'C-01';

-- C-03: Chromatograms
UPDATE checklist_items SET ai_keywords = ARRAY[
    'chromatogram', 'cromatograma', 'HPLC', 'GC', 'analytical', 'analítico', 
    'peak', 'pico', 'retention time', 'tiempo de retención', 'impurities', 'impurezas'
] WHERE code = 'C-03';

-- C-05: Labels
UPDATE checklist_items SET ai_keywords = ARRAY[
    'label', 'etiqueta', 'labeling', 'etiquetado', 'primary', 'primaria', 
    'secondary', 'secundaria', 'insert', 'inserto', 'packaging', 'empaque', 'artwork'
] WHERE code = 'C-05';

-- =====================================================
-- 5. CREATE INDEX FOR AI KEYWORDS SEARCH
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_checklist_items_ai_keywords ON checklist_items USING GIN(ai_keywords);

-- =====================================================
-- NOTES
-- =====================================================
-- This migration:
-- 1. Adds ai_keywords column for AI document classification
-- 2. Sets ALL items to allow multiple files (each stage is a folder)
-- 3. Expands B-01 into sub-items (B-01.1 to B-01.6) for better organization
-- 4. Adds AI keywords to help classify uploaded documents automatically
