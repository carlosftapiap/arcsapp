-- =====================================================
-- MIGRACIÓN: Agregar Bloques D (Eficacia/Seguridad) y E (Etiquetado)
-- Fecha: 2026-01-13
-- =====================================================

-- =====================================================
-- BLOQUE D – EFICACIA / SEGURIDAD
-- =====================================================

-- D-01: Soporte clínico / farmacológico
INSERT INTO checklist_items (
    template_id,
    code,
    module,
    title_i18n_json,
    description_i18n_json,
    required,
    critical,
    sort_order,
    ai_prompt,
    ai_cross_references
)
SELECT 
    id as template_id,
    'D-01' as code,
    'Eficacia' as module,
    '{
        "es": "Soporte Clínico / Farmacológico",
        "en": "Clinical / Pharmacological Support",
        "hi": "नैदानिक / औषधीय समर्थन",
        "zh-CN": "临床/药理支持"
    }'::jsonb as title_i18n_json,
    '{
        "es": "Documentación de soporte clínico y farmacológico del producto. Incluye estudios de eficacia, seguridad, farmacocinética y farmacodinamia. No duplicar con C-04.",
        "en": "Clinical and pharmacological support documentation for the product. Includes efficacy, safety, pharmacokinetic and pharmacodynamic studies. Do not duplicate with C-04.",
        "hi": "उत्पाद के लिए नैदानिक और औषधीय समर्थन दस्तावेज। प्रभावकारिता, सुरक्षा, फार्माकोकाइनेटिक और फार्माकोडायनामिक अध्ययन शामिल हैं।",
        "zh-CN": "产品的临床和药理支持文件。包括疗效、安全性、药代动力学和药效学研究。"
    }'::jsonb as description_i18n_json,
    true as required,
    true as critical,
    400 as sort_order,
    'Eres un experto regulatorio farmacéutico validando documentación de Soporte Clínico/Farmacológico.

VALIDAR OBLIGATORIAMENTE:
1. Tipo de documentación presentada (estudios clínicos, bibliografía, monografías)
2. Relevancia para el producto específico (principio activo, forma farmacéutica, indicación)
3. Fuentes de información (revistas indexadas, bases de datos oficiales)
4. Fecha de los estudios/publicaciones
5. Conclusiones sobre eficacia y seguridad

TIPOS DE DOCUMENTOS ACEPTADOS:
- Estudios clínicos fase I, II, III, IV
- Revisiones sistemáticas y meta-análisis
- Monografías farmacológicas oficiales (USP-NF, BP, EP)
- Bibliografía científica de revistas indexadas
- Reportes de farmacovigilancia

ALERTAS CRÍTICAS:
- ERROR si no hay documentación de soporte
- ERROR si la documentación no corresponde al principio activo
- WARNING si los estudios tienen más de 10 años
- WARNING si solo hay bibliografía sin estudios clínicos
- INFO si es producto genérico con bioequivalencia demostrada

NOTA IMPORTANTE: Este documento NO debe duplicar información de C-04 (Validación de métodos). Son documentos diferentes.

REFERENCIAS CRUZADAS: Verificar consistencia con A-02 (CPP), B-04 (Fórmula), E-01 (Etiquetas - indicaciones)',
    ARRAY['A-02', 'B-04', 'E-01']
FROM checklist_templates 
WHERE product_type = 'medicine_general' AND active = true
ON CONFLICT (template_id, code) DO UPDATE SET
    title_i18n_json = EXCLUDED.title_i18n_json,
    description_i18n_json = EXCLUDED.description_i18n_json,
    ai_prompt = EXCLUDED.ai_prompt,
    ai_cross_references = EXCLUDED.ai_cross_references;

-- =====================================================
-- BLOQUE E – ETIQUETADO
-- =====================================================

-- E-01: Etiquetas país de origen + inserto
INSERT INTO checklist_items (
    template_id,
    code,
    module,
    title_i18n_json,
    description_i18n_json,
    required,
    critical,
    sort_order,
    ai_prompt,
    ai_cross_references
)
SELECT 
    id as template_id,
    'E-01' as code,
    'Etiquetado' as module,
    '{
        "es": "Etiquetas País de Origen + Inserto",
        "en": "Country of Origin Labels + Package Insert",
        "hi": "मूल देश के लेबल + पैकेज इन्सर्ट",
        "zh-CN": "原产国标签 + 包装说明书"
    }'::jsonb as title_i18n_json,
    '{
        "es": "Etiquetas originales del país de fabricación incluyendo el inserto/prospecto completo del producto.",
        "en": "Original labels from the country of manufacture including the complete product insert/leaflet.",
        "hi": "निर्माण के देश से मूल लेबल जिसमें उत्पाद का पूर्ण इन्सर्ट/पत्रक शामिल है।",
        "zh-CN": "来自制造国的原始标签，包括完整的产品说明书。"
    }'::jsonb as description_i18n_json,
    true as required,
    true as critical,
    500 as sort_order,
    'Eres un experto regulatorio farmacéutico validando Etiquetas de País de Origen e Inserto.

VALIDAR OBLIGATORIAMENTE:
1. Etiqueta primaria (envase inmediato): nombre producto, concentración, lote, vencimiento
2. Etiqueta secundaria (caja): información completa del producto
3. Inserto/Prospecto: información para el profesional y/o paciente
4. Idioma original del país de fabricación
5. Legibilidad y calidad de imagen

CONTENIDO DEL INSERTO DEBE INCLUIR:
- Nombre del producto y composición
- Forma farmacéutica y presentación
- Indicaciones terapéuticas
- Posología y modo de administración
- Contraindicaciones
- Advertencias y precauciones
- Interacciones
- Efectos adversos
- Sobredosis
- Propiedades farmacológicas
- Condiciones de almacenamiento
- Titular y fabricante

ALERTAS CRÍTICAS:
- ERROR si falta la etiqueta primaria
- ERROR si falta el inserto completo
- ERROR si el nombre del producto no coincide con otros documentos
- WARNING si las etiquetas no son legibles
- WARNING si falta información obligatoria en el inserto
- INFO verificar que las indicaciones coincidan con D-01

REFERENCIAS CRUZADAS: Debe coincidir con A-02 (CPP), B-04 (Fórmula), D-01 (Soporte clínico), E-02 (Proyecto etiqueta Ecuador)',
    ARRAY['A-02', 'B-04', 'D-01', 'E-02']
FROM checklist_templates 
WHERE product_type = 'medicine_general' AND active = true
ON CONFLICT (template_id, code) DO UPDATE SET
    title_i18n_json = EXCLUDED.title_i18n_json,
    description_i18n_json = EXCLUDED.description_i18n_json,
    ai_prompt = EXCLUDED.ai_prompt,
    ai_cross_references = EXCLUDED.ai_cross_references;

-- E-02: Proyecto etiqueta Ecuador (si aplica)
INSERT INTO checklist_items (
    template_id,
    code,
    module,
    title_i18n_json,
    description_i18n_json,
    required,
    critical,
    sort_order,
    ai_prompt,
    ai_cross_references
)
SELECT 
    id as template_id,
    'E-02' as code,
    'Etiquetado' as module,
    '{
        "es": "Proyecto Etiqueta Ecuador",
        "en": "Ecuador Label Project",
        "hi": "इक्वाडोर लेबल प्रोजेक्ट",
        "zh-CN": "厄瓜多尔标签项目"
    }'::jsonb as title_i18n_json,
    '{
        "es": "Proyecto de etiqueta para comercialización en Ecuador. Debe ser consistente con el inserto aprobado en país de origen.",
        "en": "Label project for commercialization in Ecuador. Must be consistent with the approved insert in country of origin.",
        "hi": "इक्वाडोर में व्यापारिकीकरण के लिए लेबल प्रोजेक्ट। मूल देश में स्वीकृत इन्सर्ट के अनुरूप होना चाहिए।",
        "zh-CN": "厄瓜多尔商业化标签项目。必须与原产国批准的说明书一致。"
    }'::jsonb as description_i18n_json,
    false as required,
    false as critical,
    501 as sort_order,
    'Eres un experto regulatorio farmacéutico validando el Proyecto de Etiqueta para Ecuador.

VALIDAR OBLIGATORIAMENTE:
1. Idioma español (obligatorio para Ecuador)
2. Nombre del producto igual al CPP y registro
3. Concentración y forma farmacéutica
4. Composición cualitativa y cuantitativa
5. Indicaciones (deben coincidir con E-01)
6. Posología
7. Contraindicaciones y advertencias
8. Condiciones de almacenamiento
9. Fecha de vencimiento (formato MM/AAAA)
10. Nombre del titular en Ecuador
11. Nombre y país del fabricante
12. Número de lote
13. Número de Registro Sanitario (espacio para colocar)

REQUISITOS ARCSA ESPECÍFICOS:
- Texto legible, tamaño mínimo según normativa
- Logo ARCSA si es requerido
- Leyendas obligatorias según tipo de producto
- Semáforo nutricional si aplica

ALERTAS CRÍTICAS:
- ERROR si el contenido difiere significativamente del inserto original (E-01)
- ERROR si faltan datos obligatorios del fabricante
- ERROR si las indicaciones no coinciden con el CPP
- WARNING si hay inconsistencias menores con E-01
- WARNING si falta espacio para número de registro sanitario
- INFO si es etiqueta bilingüe (español + otro idioma)

REFERENCIAS CRUZADAS: Debe ser consistente con E-01 (Etiquetas origen), A-02 (CPP), B-04 (Fórmula)',
    ARRAY['E-01', 'A-02', 'B-04']
FROM checklist_templates 
WHERE product_type = 'medicine_general' AND active = true
ON CONFLICT (template_id, code) DO UPDATE SET
    title_i18n_json = EXCLUDED.title_i18n_json,
    description_i18n_json = EXCLUDED.description_i18n_json,
    ai_prompt = EXCLUDED.ai_prompt,
    ai_cross_references = EXCLUDED.ai_cross_references;

-- =====================================================
-- TAMBIÉN AGREGAR A PLANTILLA DE BIOLÓGICOS SI EXISTE
-- =====================================================

-- D-01 para biológicos
INSERT INTO checklist_items (
    template_id,
    code,
    module,
    title_i18n_json,
    description_i18n_json,
    required,
    critical,
    sort_order,
    ai_prompt,
    ai_cross_references
)
SELECT 
    id as template_id,
    'D-01' as code,
    'Eficacia' as module,
    '{
        "es": "Soporte Clínico / Farmacológico",
        "en": "Clinical / Pharmacological Support",
        "hi": "नैदानिक / औषधीय समर्थन",
        "zh-CN": "临床/药理支持"
    }'::jsonb as title_i18n_json,
    '{
        "es": "Documentación de soporte clínico y farmacológico del producto biológico. Incluye estudios de eficacia, seguridad, inmunogenicidad.",
        "en": "Clinical and pharmacological support documentation for the biological product. Includes efficacy, safety, immunogenicity studies.",
        "hi": "जैविक उत्पाद के लिए नैदानिक और औषधीय समर्थन दस्तावेज।",
        "zh-CN": "生物制品的临床和药理支持文件。"
    }'::jsonb as description_i18n_json,
    true as required,
    true as critical,
    400 as sort_order,
    'Eres un experto regulatorio validando documentación de Soporte Clínico/Farmacológico para PRODUCTOS BIOLÓGICOS.

VALIDAR OBLIGATORIAMENTE:
1. Estudios clínicos específicos para el biológico
2. Datos de inmunogenicidad
3. Estudios de biosimilitud (si aplica)
4. Farmacocinética y farmacodinamia
5. Datos de eficacia por indicación

CONSIDERACIONES ESPECIALES BIOLÓGICOS:
- Mayor énfasis en seguridad e inmunogenicidad
- Estudios de comparabilidad si es biosimilar
- Datos de lotes clínicos vs comerciales

ALERTAS CRÍTICAS:
- ERROR si faltan datos de inmunogenicidad
- ERROR si no hay estudios clínicos adecuados
- WARNING si biosimilar sin estudios de comparabilidad',
    ARRAY['A-02', 'B-04', 'E-01']
FROM checklist_templates 
WHERE product_type = 'biologic' AND active = true
ON CONFLICT (template_id, code) DO UPDATE SET
    title_i18n_json = EXCLUDED.title_i18n_json,
    description_i18n_json = EXCLUDED.description_i18n_json,
    ai_prompt = EXCLUDED.ai_prompt,
    ai_cross_references = EXCLUDED.ai_cross_references;

-- E-01 para biológicos
INSERT INTO checklist_items (
    template_id,
    code,
    module,
    title_i18n_json,
    description_i18n_json,
    required,
    critical,
    sort_order,
    ai_prompt,
    ai_cross_references
)
SELECT 
    id as template_id,
    'E-01' as code,
    'Etiquetado' as module,
    '{
        "es": "Etiquetas País de Origen + Inserto",
        "en": "Country of Origin Labels + Package Insert",
        "hi": "मूल देश के लेबल + पैकेज इन्सर्ट",
        "zh-CN": "原产国标签 + 包装说明书"
    }'::jsonb as title_i18n_json,
    '{
        "es": "Etiquetas originales del país de fabricación incluyendo el inserto/prospecto completo del producto biológico.",
        "en": "Original labels from the country of manufacture including the complete biological product insert/leaflet.",
        "hi": "निर्माण के देश से मूल लेबल जिसमें जैविक उत्पाद का पूर्ण इन्सर्ट शामिल है।",
        "zh-CN": "来自制造国的原始标签，包括完整的生物制品说明书。"
    }'::jsonb as description_i18n_json,
    true as required,
    true as critical,
    500 as sort_order,
    'Eres un experto regulatorio validando Etiquetas de País de Origen e Inserto para PRODUCTOS BIOLÓGICOS.

VALIDAR OBLIGATORIAMENTE:
1. Condiciones especiales de almacenamiento (cadena de frío)
2. Información de inmunogenicidad en inserto
3. Advertencias específicas para biológicos
4. Instrucciones de reconstitución si aplica
5. Información del lote y trazabilidad

ALERTAS CRÍTICAS:
- ERROR si faltan condiciones de almacenamiento específicas
- ERROR si no hay advertencias de inmunogenicidad
- WARNING si falta información de reconstitución',
    ARRAY['A-02', 'B-04', 'D-01', 'E-02']
FROM checklist_templates 
WHERE product_type = 'biologic' AND active = true
ON CONFLICT (template_id, code) DO UPDATE SET
    title_i18n_json = EXCLUDED.title_i18n_json,
    description_i18n_json = EXCLUDED.description_i18n_json,
    ai_prompt = EXCLUDED.ai_prompt,
    ai_cross_references = EXCLUDED.ai_cross_references;

-- E-02 para biológicos
INSERT INTO checklist_items (
    template_id,
    code,
    module,
    title_i18n_json,
    description_i18n_json,
    required,
    critical,
    sort_order,
    ai_prompt,
    ai_cross_references
)
SELECT 
    id as template_id,
    'E-02' as code,
    'Etiquetado' as module,
    '{
        "es": "Proyecto Etiqueta Ecuador",
        "en": "Ecuador Label Project",
        "hi": "इक्वाडोर लेबल प्रोजेक्ट",
        "zh-CN": "厄瓜多尔标签项目"
    }'::jsonb as title_i18n_json,
    '{
        "es": "Proyecto de etiqueta para comercialización en Ecuador. Debe incluir requisitos específicos para biológicos.",
        "en": "Label project for commercialization in Ecuador. Must include specific requirements for biologics.",
        "hi": "इक्वाडोर में व्यापारिकीकरण के लिए लेबल प्रोजेक्ट। जैविक के लिए विशिष्ट आवश्यकताएं शामिल होनी चाहिए।",
        "zh-CN": "厄瓜多尔商业化标签项目。必须包括生物制品的特定要求。"
    }'::jsonb as description_i18n_json,
    false as required,
    false as critical,
    501 as sort_order,
    'Eres un experto regulatorio validando el Proyecto de Etiqueta Ecuador para PRODUCTOS BIOLÓGICOS.

VALIDAR OBLIGATORIAMENTE:
1. Condiciones de almacenamiento en español (2-8°C, etc.)
2. Advertencias de inmunogenicidad en español
3. Instrucciones de uso/reconstitución
4. Información de trazabilidad del lote

ALERTAS CRÍTICAS:
- ERROR si faltan condiciones de cadena de frío
- ERROR si no coincide con inserto original (E-01)
- WARNING si falta información de reconstitución',
    ARRAY['E-01', 'A-02', 'B-04']
FROM checklist_templates 
WHERE product_type = 'biologic' AND active = true
ON CONFLICT (template_id, code) DO UPDATE SET
    title_i18n_json = EXCLUDED.title_i18n_json,
    description_i18n_json = EXCLUDED.description_i18n_json,
    ai_prompt = EXCLUDED.ai_prompt,
    ai_cross_references = EXCLUDED.ai_cross_references;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Verificar que los items se agregaron correctamente
SELECT 
    ct.product_type,
    ci.code,
    ci.module,
    ci.title_i18n_json->>'es' as titulo_es,
    ci.required,
    ci.critical
FROM checklist_items ci
JOIN checklist_templates ct ON ci.template_id = ct.id
WHERE ci.code IN ('D-01', 'E-01', 'E-02')
ORDER BY ct.product_type, ci.sort_order;
