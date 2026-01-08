-- =====================================================
-- ARCSAPP - Actualizar traducciones del Checklist
-- Idiomas: ES (Español), EN (English), HI (हिंदी), ZH (中文)
-- =====================================================

-- MÓDULO LEGAL (A-01 a A-04)
UPDATE checklist_items SET title_i18n_json = '{
    "es": "Certificado de Buenas Prácticas de Manufactura (BPM)",
    "en": "Good Manufacturing Practices (GMP) Certificate",
    "hi": "अच्छी विनिर्माण प्रथाएं (जीएमपी) प्रमाणपत्र",
    "zh-CN": "良好生产规范 (GMP) 证书"
}'::jsonb WHERE code = 'A-01';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Certificado de Libre Venta (CLV) / CPP",
    "en": "Certificate of Free Sale (CFS) / CPP",
    "hi": "मुफ्त बिक्री प्रमाणपत्र (सीएफएस) / सीपीपी",
    "zh-CN": "自由销售证书 (CFS) / CPP"
}'::jsonb WHERE code = 'A-02';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Declaración del Titular - Estado Regulatorio Internacional",
    "en": "Holder Declaration - International Regulatory Status",
    "hi": "धारक घोषणा - अंतर्राष्ट्रीय नियामक स्थिति",
    "zh-CN": "持有人声明 - 国际监管状态"
}'::jsonb WHERE code = 'A-03';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Autorización del Titular (Poder Legal)",
    "en": "Holder Authorization (Power of Attorney)",
    "hi": "धारक प्राधिकरण (पावर ऑफ अटॉर्नी)",
    "zh-CN": "持有人授权 (委托书)"
}'::jsonb WHERE code = 'A-04';

-- MÓDULO QUALITY (B-01 a B-11)
UPDATE checklist_items SET title_i18n_json = '{
    "es": "Certificado de Análisis de Producto Terminado",
    "en": "Finished Product Certificate of Analysis",
    "hi": "तैयार उत्पाद विश्लेषण प्रमाणपत्र",
    "zh-CN": "成品分析证书"
}'::jsonb WHERE code = 'B-01';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Certificados de Análisis de Materia Prima / API",
    "en": "Raw Material / API Certificates of Analysis",
    "hi": "कच्चे माल / एपीआई विश्लेषण प्रमाणपत्र",
    "zh-CN": "原材料/API 分析证书"
}'::jsonb WHERE code = 'B-02';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Especificaciones de Calidad de Producto Terminado",
    "en": "Finished Product Quality Specifications",
    "hi": "तैयार उत्पाद गुणवत्ता विनिर्देश",
    "zh-CN": "成品质量规格"
}'::jsonb WHERE code = 'B-03';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Fórmula Cualicuantitativa Completa (Unidades SI)",
    "en": "Complete Qualitative-Quantitative Formula (SI Units)",
    "hi": "पूर्ण गुणात्मक-मात्रात्मक सूत्र (एसआई इकाइयां)",
    "zh-CN": "完整定性定量配方 (SI单位)"
}'::jsonb WHERE code = 'B-04';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Justificación de la Fórmula Cualitativa",
    "en": "Qualitative Formula Justification",
    "hi": "गुणात्मक सूत्र औचित्य",
    "zh-CN": "定性配方论证"
}'::jsonb WHERE code = 'B-05';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Declaración de Excipientes y Colorantes Autorizados",
    "en": "Declaration of Authorized Excipients and Colorants",
    "hi": "अधिकृत अंशधारकों और रंगों की घोषणा",
    "zh-CN": "授权辅料和着色剂声明"
}'::jsonb WHERE code = 'B-06';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Descripción del Proceso de Manufactura",
    "en": "Manufacturing Process Description",
    "hi": "विनिर्माण प्रक्रिया विवरण",
    "zh-CN": "生产工艺说明"
}'::jsonb WHERE code = 'B-07';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Flujograma del Proceso de Manufactura",
    "en": "Manufacturing Process Flowchart",
    "hi": "विनिर्माण प्रक्रिया फ्लोचार्ट",
    "zh-CN": "生产工艺流程图"
}'::jsonb WHERE code = 'B-08';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Metodología Analítica y Validación",
    "en": "Analytical Methodology and Validation",
    "hi": "विश्लेषणात्मक कार्यप्रणाली और सत्यापन",
    "zh-CN": "分析方法和验证"
}'::jsonb WHERE code = 'B-09';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Interpretación del Código de Lote",
    "en": "Batch Code Interpretation",
    "hi": "बैच कोड व्याख्या",
    "zh-CN": "批号解释"
}'::jsonb WHERE code = 'B-10';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Descripción de Envase Primario y Secundario",
    "en": "Primary and Secondary Packaging Description",
    "hi": "प्राथमिक और द्वितीयक पैकेजिंग विवरण",
    "zh-CN": "初级和二级包装说明"
}'::jsonb WHERE code = 'B-11';

-- MÓDULO QUALITY/STABILITY (C-01 a C-03)
UPDATE checklist_items SET title_i18n_json = '{
    "es": "Estudios de Estabilidad (Larga duración y Acelerada)",
    "en": "Stability Studies (Long-term and Accelerated)",
    "hi": "स्थिरता अध्ययन (दीर्घकालिक और त्वरित)",
    "zh-CN": "稳定性研究 (长期和加速)"
}'::jsonb WHERE code = 'C-01';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Protocolo de Estabilidad y Conclusión de Vida Útil",
    "en": "Stability Protocol and Shelf Life Conclusion",
    "hi": "स्थिरता प्रोटोकॉल और शेल्फ लाइफ निष्कर्ष",
    "zh-CN": "稳定性方案和保质期结论"
}'::jsonb WHERE code = 'C-02';

UPDATE checklist_items SET title_i18n_json = '{
    "es": "Cromatogramas / Registros Analíticos",
    "en": "Chromatograms / Analytical Records",
    "hi": "क्रोमैटोग्राम / विश्लेषणात्मक रिकॉर्ड",
    "zh-CN": "色谱图/分析记录"
}'::jsonb WHERE code = 'C-03';

-- MÓDULO EFFICACY (C-04)
UPDATE checklist_items SET title_i18n_json = '{
    "es": "Documentación de Soporte Clínico / Farmacológico",
    "en": "Clinical / Pharmacological Support Documentation",
    "hi": "नैदानिक / औषधीय सहायता दस्तावेज़ीकरण",
    "zh-CN": "临床/药理学支持文件"
}'::jsonb WHERE code = 'C-04';

-- MÓDULO GENERAL (C-05)
UPDATE checklist_items SET title_i18n_json = '{
    "es": "Etiquetas Originales del País de Origen",
    "en": "Original Labels from Country of Origin",
    "hi": "मूल देश की मूल लेबल",
    "zh-CN": "原产国原始标签"
}'::jsonb WHERE code = 'C-05';

-- =====================================================
-- Verificar las actualizaciones
-- =====================================================
SELECT code, module, title_i18n_json 
FROM checklist_items 
ORDER BY sort_order;
