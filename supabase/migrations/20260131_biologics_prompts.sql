-- =====================================================
-- ACTUALIZAR PROMPTS DE IA - Biológicos
-- =====================================================

-- BIO-01 – Solicitud de Registro Sanitario Biológico
UPDATE checklist_items SET ai_prompt = 'Eres un experto regulatorio ARCSA especializado en productos biológicos.
Evalúa la Solicitud de Registro Sanitario para un medicamento biológico.

VALIDAR OBLIGATORIAMENTE:
- Identificación clara del producto como biológico o biosimilar
- Forma farmacéutica, concentración y vía de administración
- Identificación del titular del registro y fabricante
- Coherencia con el dossier técnico presentado
- Firma electrónica del Responsable Técnico habilitado

CONSIDERACIONES ESPECIALES BIOLÓGICOS:
- La solicitud debe indicar si es innovador o biosimilar
- Debe corresponder a un solo producto / concentración

ALERTAS CRÍTICAS:
- ERROR si no se identifica claramente como biológico
- ERROR si hay inconsistencias con el dossier técnico
- WARNING si no se declara condición de biosimilar cuando aplica

REFERENCIAS CRUZADAS:
BIO-03, BIO-05, D-01, E-01'
WHERE code = 'BIO-01' AND template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'biologic' LIMIT 1
);

-- BIO-02 – Datos de Estabilidad
UPDATE checklist_items SET ai_prompt = 'Actúa como evaluador ARCSA de estabilidad para productos biológicos.
Evalúa los datos de estabilidad del producto biológico.

VALIDAR OBLIGATORIAMENTE:
- Estudios de estabilidad en condiciones reales y aceleradas
- Condiciones de almacenamiento (cadena de frío, congelación, etc.)
- Número de lotes evaluados (mínimo 3, salvo justificación)
- Métodos indicativos de estabilidad (potencia, pureza, agregados)

CONSIDERACIONES BIOLÓGICAS:
- La estabilidad debe evaluar actividad biológica
- No basta solo con parámetros fisicoquímicos

ALERTAS CRÍTICAS:
- ERROR si no se evalúa potencia biológica
- ERROR si no se justifican condiciones de almacenamiento
- WARNING si la vida útil no está soportada completamente

REFERENCIAS CRUZADAS:
BIO-03, BIO-04, E-01, E-02'
WHERE code = 'BIO-02' AND template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'biologic' LIMIT 1
);

-- BIO-03 – Proceso de Fabricación Biológico
UPDATE checklist_items SET ai_prompt = 'Eres un especialista ARCSA en procesos de fabricación de biológicos.
Evalúa la descripción del proceso de fabricación del producto biológico.

VALIDAR OBLIGATORIAMENTE:
- Descripción completa del proceso (upstream y downstream)
- Origen del material biológico (células, microorganismos, líneas celulares)
- Controles en proceso críticos (CPP, CQA)
- Estrategia de control de variabilidad

CONSIDERACIONES BIOLÓGICAS:
- El proceso define el producto
- Cambios menores pueden impactar seguridad y eficacia

ALERTAS CRÍTICAS:
- ERROR si el proceso no está completamente descrito
- ERROR si no se controlan variables críticas
- WARNING si hay dependencia excesiva de procesos manuales

REFERENCIAS CRUZADAS:
BIO-04, BIO-05, D-01'
WHERE code = 'BIO-03' AND template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'biologic' LIMIT 1
);

-- BIO-04 – Certificado de Control de Calidad
UPDATE checklist_items SET ai_prompt = 'Actúa como revisor ARCSA de control de calidad para biológicos.
Evalúa el Certificado de Control de Calidad del producto biológico.

VALIDAR OBLIGATORIAMENTE:
- Identificación del lote
- Ensayos de potencia biológica
- Ensayos de pureza, identidad y esterilidad
- Límites de agregados y contaminantes

CONSIDERACIONES BIOLÓGICAS:
- La potencia es un parámetro crítico
- Los métodos deben ser bioensayos validados

ALERTAS CRÍTICAS:
- ERROR si no se evalúa potencia
- ERROR si los métodos no están validados
- WARNING si los criterios de aceptación no están claros

REFERENCIAS CRUZADAS:
BIO-02, BIO-03, D-01'
WHERE code = 'BIO-04' AND template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'biologic' LIMIT 1
);

-- BIO-05 – Licencia de Fabricante de Biológicos
UPDATE checklist_items SET ai_prompt = 'Eres un inspector regulatorio ARCSA en plantas de biológicos.
Evalúa la Licencia del fabricante de productos biológicos.

VALIDAR OBLIGATORIAMENTE:
- Autoridad sanitaria emisora
- Alcance específico para productos biológicos
- Dirección y nombre legal del fabricante
- Vigencia de la licencia

CONSIDERACIONES BIOLÓGICAS:
- No es válida una licencia genérica de sólidos/orales
- Debe cubrir biotecnología / biológicos

ALERTAS CRÍTICAS:
- ERROR si la licencia no cubre biológicos
- ERROR si está vencida
- WARNING si el alcance es ambiguo

REFERENCIAS CRUZADAS:
BIO-03, A-01 (BPM), D-01'
WHERE code = 'BIO-05' AND template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'biologic' LIMIT 1
);

-- NEW-9 – Farmacovigilancia Post-Registro
UPDATE checklist_items SET ai_prompt = 'Actúa como experto ARCSA en farmacovigilancia de productos biológicos.
Evalúa el plan de farmacovigilancia y gestión de riesgos del producto biológico.

VALIDAR OBLIGATORIAMENTE:
- Plan de farmacovigilancia específico para biológicos
- Estrategia de detección de inmunogenicidad post-comercialización
- Sistema de trazabilidad por lote
- Procedimientos de notificación a ARCSA

CONSIDERACIONES BIOLÓGICAS:
- Los biológicos requieren vigilancia reforzada
- La inmunogenicidad puede aparecer post-registro

ALERTAS CRÍTICAS:
- ERROR si no existe plan de farmacovigilancia
- ERROR si no hay trazabilidad por lote
- WARNING si el plan es genérico (no específico para biológicos)

REFERENCIAS CRUZADAS:
D-01, E-01, E-02'
WHERE code = 'NEW-9' AND template_id = (
    SELECT id FROM checklist_templates WHERE product_type = 'biologic' LIMIT 1
);
