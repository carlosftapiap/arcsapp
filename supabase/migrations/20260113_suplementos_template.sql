-- Plantilla para Suplementos Alimenticios ARCSA Ecuador

-- 1. Crear la plantilla
INSERT INTO checklist_templates (id, product_type, name, version, active, created_at)
VALUES (
    gen_random_uuid(),
    'supplement_food',
    'Suplementos Alimenticios - ARCSA Ecuador',
    1,
    true,
    NOW()
);

-- 2. Obtener el ID de la plantilla recién creada
DO $$
DECLARE
    template_id UUID;
BEGIN
    SELECT id INTO template_id FROM checklist_templates 
    WHERE product_type = 'supplement_food' AND version = 1 LIMIT 1;

    -- BLOQUE A - LEGAL / ADMINISTRATIVO
    INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, required, sort_order, ai_prompt) VALUES
    (gen_random_uuid(), template_id, 'A-01', 'Legal', '{"es": "Solicitud de Notificación Sanitaria Obligatoria (NSO) en VUE", "en": "Mandatory Sanitary Notification Request (NSO) in VUE"}', true, 1,
    'Valida que exista la solicitud de NSO en formato VUE. CRÍTICO: Debe estar correctamente diligenciada con todos los campos obligatorios. ERROR si falta o está incompleta.'),
    
    (gen_random_uuid(), template_id, 'A-02', 'Legal', '{"es": "Certificado de Libre Venta (CLV) como suplemento/alimento", "en": "Free Sale Certificate as supplement/food"}', true, 2,
    'Valida el CLV emitido por autoridad competente. CRÍTICO: Debe indicar claramente que es SUPLEMENTO ALIMENTICIO o ALIMENTO, NO medicamento. ERROR si indica categoría farmacéutica.'),
    
    (gen_random_uuid(), template_id, 'A-03', 'Legal', '{"es": "Declaración del Titular del Producto", "en": "Product Owner Declaration"}', false, 3,
    'Verifica declaración jurada del titular sobre la veracidad de información. Debe incluir firma y datos del representante legal.'),
    
    (gen_random_uuid(), template_id, 'A-04', 'Legal', '{"es": "Autorización del Titular / Poder Legal (si aplica)", "en": "Owner Authorization / Power of Attorney (if applicable)"}', true, 4,
    'CRÍTICO si el solicitante no es el titular directo. Debe existir poder notarizado o carta de autorización con firma legalizada.'),
    
    (gen_random_uuid(), template_id, 'A-05', 'Legal', '{"es": "Certificado de BPM de Alimentos del fabricante", "en": "Food GMP Certificate of manufacturer"}', true, 5,
    'CRÍTICO: Verificar BPM de ALIMENTOS (no farmacéutico). ERROR COMÚN: presentar BPM farmacéutico para suplementos. Debe ser certificado vigente de la planta de alimentos.'),
    
    (gen_random_uuid(), template_id, 'A-06', 'Legal', '{"es": "Identificación del Fabricante y Envasador", "en": "Manufacturer and Packager Identification"}', false, 6,
    'Datos completos: razón social, dirección, país, contacto. Si fabricante ≠ envasador, identificar ambos.'),
    
    (gen_random_uuid(), template_id, 'A-07', 'Legal', '{"es": "Contrato de fabricación / maquila (si aplica)", "en": "Manufacturing / Maquila Contract (if applicable)"}', false, 7,
    'Requerido si hay tercerización. Debe especificar responsabilidades, producto, y estar firmado por ambas partes.'),
    
    (gen_random_uuid(), template_id, 'A-08', 'Legal', '{"es": "Traducciones oficiales (si documentos no están en español)", "en": "Official translations (if documents not in Spanish)"}', false, 8,
    'Traducciones certificadas por traductor oficial. Aplica a CLV, CoA, especificaciones en idioma extranjero.');

    -- BLOQUE B - TÉCNICO / CALIDAD
    INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, required, sort_order, ai_prompt) VALUES
    (gen_random_uuid(), template_id, 'B-01', 'Calidad', '{"es": "Descripción general del producto", "en": "General product description"}', true, 9,
    'CRÍTICO: Descripción como SUPLEMENTO ALIMENTICIO. Incluir: forma farmacéutica (cápsula, tableta, polvo), presentación, uso previsto. ERROR si describe como medicamento.'),
    
    (gen_random_uuid(), template_id, 'B-02', 'Calidad', '{"es": "Fórmula cuali-cuantitativa nutricional", "en": "Nutritional quali-quantitative formula"}', true, 10,
    'CRÍTICO: Fórmula expresada en unidades nutricionales (mg, mcg, UI por porción). ERROR COMÚN: expresar como dosis terapéutica. Debe coincidir con tabla nutricional de etiqueta.'),
    
    (gen_random_uuid(), template_id, 'B-03', 'Calidad', '{"es": "Justificación nutricional de ingredientes", "en": "Nutritional justification of ingredients"}', true, 11,
    'CRÍTICO: Justificar cada ingrediente con función NUTRICIONAL, no terapéutica. Citar referencias de ingesta recomendada (RDA, VDR).'),
    
    (gen_random_uuid(), template_id, 'B-04', 'Calidad', '{"es": "Función nutricional de cada componente", "en": "Nutritional function of each component"}', false, 12,
    'Explicar rol nutricional de vitaminas, minerales, extractos. Evitar claims terapéuticos.'),
    
    (gen_random_uuid(), template_id, 'B-05', 'Calidad', '{"es": "Certificado de Análisis de Producto Terminado", "en": "Finished Product Certificate of Analysis"}', true, 13,
    'CRÍTICO: CoA de lote reciente. Debe incluir: identidad, potencia de activos, límites microbiológicos, metales pesados si aplica. Valores deben coincidir con especificaciones.'),
    
    (gen_random_uuid(), template_id, 'B-06', 'Calidad', '{"es": "Especificaciones fisicoquímicas", "en": "Physicochemical specifications"}', true, 14,
    'CRÍTICO: Especificaciones de liberación y vida útil. Incluir: aspecto, peso promedio, desintegración si aplica, contenido de activos.'),
    
    (gen_random_uuid(), template_id, 'B-07', 'Calidad', '{"es": "Especificaciones microbiológicas", "en": "Microbiological specifications"}', true, 15,
    'CRÍTICO: Límites según Codex o normativa de alimentos. Incluir: aerobios, coliformes, E.coli, mohos/levaduras, Salmonella, S.aureus.'),
    
    (gen_random_uuid(), template_id, 'B-08', 'Calidad', '{"es": "Certificados de Análisis de Materias Primas", "en": "Raw Materials Certificates of Analysis"}', false, 16,
    'CoA de ingredientes activos principales. Verificar trazabilidad y conformidad con especificaciones.'),
    
    (gen_random_uuid(), template_id, 'B-09', 'Calidad', '{"es": "Descripción resumida del proceso de fabricación", "en": "Brief description of manufacturing process"}', false, 17,
    'Descripción general del proceso: pesaje, mezclado, encapsulado/tableteado, envasado. No requiere detalle farmacéutico.'),
    
    (gen_random_uuid(), template_id, 'B-10', 'Calidad', '{"es": "Flujograma simple del proceso", "en": "Simple process flowchart"}', false, 18,
    'Diagrama de flujo básico de operaciones unitarias. Identificar puntos de control.'),
    
    (gen_random_uuid(), template_id, 'B-11', 'Calidad', '{"es": "Interpretación del código de lote", "en": "Lot code interpretation"}', false, 19,
    'Explicar sistema de codificación de lotes para trazabilidad.'),
    
    (gen_random_uuid(), template_id, 'B-12', 'Calidad', '{"es": "Descripción del envase primario y secundario", "en": "Primary and secondary packaging description"}', false, 20,
    'Material del envase (HDPE, vidrio, blister), capacidad, tipo de cierre.');

    -- BLOQUE C - VIDA ÚTIL / ESTABILIDAD SIMPLIFICADA
    INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, required, sort_order, ai_prompt) VALUES
    (gen_random_uuid(), template_id, 'C-01', 'Estabilidad', '{"es": "Declaración de vida útil del producto", "en": "Product shelf life declaration"}', true, 21,
    'CRÍTICO: Declarar vida útil en meses/años. NOTA: NO se exige estabilidad acelerada ni larga duración como en medicamentos.'),
    
    (gen_random_uuid(), template_id, 'C-02', 'Estabilidad', '{"es": "Sustento técnico de vida útil (bibliográfico o histórico)", "en": "Technical support for shelf life (bibliographic or historical)"}', false, 22,
    'Justificar vida útil con: datos históricos de productos similares, referencias bibliográficas, o estudios simplificados. ERROR: no tener ningún sustento.'),
    
    (gen_random_uuid(), template_id, 'C-03', 'Estabilidad', '{"es": "Condiciones de almacenamiento", "en": "Storage conditions"}', false, 23,
    'Indicar temperatura, humedad, protección de luz. Debe coincidir con lo declarado en etiqueta.'),
    
    (gen_random_uuid(), template_id, 'C-04', 'Estabilidad', '{"es": "Control de cambios de formulación (si aplica)", "en": "Formula change control (if applicable)"}', false, 24,
    'Si hubo cambios en fórmula o proceso, documentar y justificar impacto en estabilidad.');

    -- BLOQUE D - ETIQUETADO (CRÍTICO)
    INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, required, sort_order, ai_prompt) VALUES
    (gen_random_uuid(), template_id, 'D-01', 'Etiquetado', '{"es": "Proyecto de etiqueta en español", "en": "Label project in Spanish"}', true, 25,
    'CRÍTICO: Etiqueta completa en español. Verificar legibilidad, cumplimiento normativo ARCSA.'),
    
    (gen_random_uuid(), template_id, 'D-02', 'Etiquetado', '{"es": "Denominación del producto como SUPLEMENTO ALIMENTICIO", "en": "Product denomination as FOOD SUPPLEMENT"}', true, 26,
    'CRÍTICO: Debe decir "SUPLEMENTO ALIMENTICIO" claramente visible. ERROR: denominaciones como "suplemento nutricional", "complemento dietético" sin la denominación oficial.'),
    
    (gen_random_uuid(), template_id, 'D-03', 'Etiquetado', '{"es": "Lista de ingredientes en orden decreciente", "en": "Ingredient list in descending order"}', true, 27,
    'CRÍTICO: Ingredientes ordenados de mayor a menor cantidad. Identificar alérgenos. Nombres según normativa.'),
    
    (gen_random_uuid(), template_id, 'D-04', 'Etiquetado', '{"es": "Tabla nutricional", "en": "Nutrition facts table"}', true, 28,
    'CRÍTICO: Formato según normativa ecuatoriana. Valores por porción y %VDR. Debe coincidir con fórmula cuali-cuantitativa.'),
    
    (gen_random_uuid(), template_id, 'D-05', 'Etiquetado', '{"es": "Dosis diaria recomendada", "en": "Recommended daily dose"}', true, 29,
    'CRÍTICO: Indicar porción/dosis diaria. ERROR COMÚN: dosis que parecen medicamentos (cada 8 horas, etc.).'),
    
    (gen_random_uuid(), template_id, 'D-06', 'Etiquetado', '{"es": "Advertencias obligatorias", "en": "Mandatory warnings"}', true, 30,
    'CRÍTICO: Incluir advertencias: "Mantener fuera del alcance de los niños", "No exceder dosis recomendada", "No es medicamento", advertencias específicas si aplica.'),
    
    (gen_random_uuid(), template_id, 'D-07', 'Etiquetado', '{"es": "Lote, fecha de vencimiento", "en": "Lot, expiration date"}', true, 31,
    'CRÍTICO: Espacio para lote y fecha de vencimiento. Formato de fecha claro.'),
    
    (gen_random_uuid(), template_id, 'D-08', 'Etiquetado', '{"es": "Datos de fabricante y titular", "en": "Manufacturer and owner data"}', true, 32,
    'CRÍTICO: Nombre y dirección del fabricante. Datos del titular/importador en Ecuador.'),
    
    (gen_random_uuid(), template_id, 'D-09', 'Etiquetado', '{"es": "Ausencia de alegaciones terapéuticas", "en": "Absence of therapeutic claims"}', true, 33,
    'CRÍTICO: Verificar que NO existan claims como "previene", "trata", "cura", "alivia", "combate enfermedades". ERROR GRAVE que causa rechazo.');

    -- BLOQUE E - SOPORTE / OPCIONAL
    INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, required, sort_order, ai_prompt) VALUES
    (gen_random_uuid(), template_id, 'E-01', 'General', '{"es": "Bibliografía nutricional", "en": "Nutritional bibliography"}', false, 34,
    'Referencias científicas que sustentan uso de ingredientes. Opcional pero recomendado.'),
    
    (gen_random_uuid(), template_id, 'E-02', 'General', '{"es": "Estudios internacionales de uso seguro", "en": "International safety studies"}', false, 35,
    'Evidencia de seguridad de ingredientes: GRAS status, monografías EFSA, etc.'),
    
    (gen_random_uuid(), template_id, 'E-03', 'General', '{"es": "Etiqueta original país de origen", "en": "Original label from country of origin"}', false, 36,
    'Para productos importados: etiqueta original como referencia.'),
    
    (gen_random_uuid(), template_id, 'E-04', 'General', '{"es": "Material publicitario (si existe)", "en": "Advertising material (if exists)"}', false, 37,
    'Verificar que material promocional no contenga claims terapéuticos prohibidos.');

END $$;
