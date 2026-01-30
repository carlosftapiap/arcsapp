-- =====================================================
-- MIGRACIÓN: Agregar Plantilla "Bioequivalencia (BE)"
-- =====================================================

-- 1. Actualizar constraints para incluir 'bioequivalence'
-- ---------------------------------------------------------------------

-- Tabla products
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_product_type_check;
ALTER TABLE products ADD CONSTRAINT products_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food', 'corporate_docs', 'bioequivalence'));

-- Tabla dossiers
ALTER TABLE dossiers DROP CONSTRAINT IF EXISTS dossiers_product_type_check;
ALTER TABLE dossiers ADD CONSTRAINT dossiers_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food', 'corporate_docs', 'bioequivalence'));

-- Tabla checklist_templates
ALTER TABLE checklist_templates DROP CONSTRAINT IF EXISTS checklist_templates_product_type_check;
ALTER TABLE checklist_templates ADD CONSTRAINT checklist_templates_product_type_check 
CHECK (product_type IN ('medicine_general', 'biologic', 'device_medical', 'supplement_food', 'corporate_docs', 'bioequivalence'));


-- 2. Crear la Plantilla
-- UUID generado: f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f
-- ---------------------------------------------------------------------
INSERT INTO checklist_templates (id, product_type, name, version, active, created_at)
VALUES (
    'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f',
    'bioequivalence',
    'Bioequivalencia (BE) - ARCSA',
    1,
    true,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 3. Insertar Items por Módulo
-- Módulo 1: Bioequivalencia – Documentos Técnicos
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-01', 'Documentos Técnicos', 
'{"es": "Justificación de Requisito de Bioequivalencia", "en": "Bioequivalence Requirement Justification"}',
'{"es": "Tabla 1 ARCSA / Clasificación BCS justificando necesidad del estudio."}', 
true, false, 10),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-02', 'Documentos Técnicos', 
'{"es": "Clasificación Biofarmacéutica (BCS)", "en": "Biopharmaceutical Classification (BCS)"}',
'{"es": "Clasificación BCS del principio activo según solubilidad y permeabilidad."}', 
true, false, 20),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-03', 'Documentos Técnicos', 
'{"es": "Selección del Medicamento de Referencia", "en": "Reference Drug Selection"}',
'{"es": "Justificación y evidencia del medicamento de referencia seleccionado."}', 
true, false, 30),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-04', 'Documentos Técnicos', 
'{"es": "Protocolo del Estudio BE/Bioexención", "en": "BE/Biowaiver Study Protocol"}',
'{"es": "Protocolo completo del estudio de bioequivalencia o bioexención."}', 
true, false, 40),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-05', 'Documentos Técnicos', 
'{"es": "Aprobación Comité de Ética (CEISH)", "en": "Ethics Committee Approval (CEISH)"}',
'{"es": "Aprobación ética del protocolo por comité autorizado."}', 
true, false, 50),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-06', 'Documentos Técnicos', 
'{"es": "Autorización ARCSA para Estudio In Vivo", "en": "ARCSA Authorization for In Vivo Study"}',
'{"es": "Autorización previa de ARCSA si el estudio es in vivo (si aplica)."}', 
false, false, 60);

-- Módulo 2: Etapa Clínica (In Vivo)
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-07', 'Etapa Clínica', 
'{"es": "Certificado BPC del Centro", "en": "GCP Certificate"}',
'{"es": "Certificado de Buenas Prácticas Clínicas del centro de investigación."}', 
true, false, 100),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-08', 'Etapa Clínica', 
'{"es": "Certificación del Centro de Investigación", "en": "Research Center Certification"}',
'{"es": "Certificación y habilitación del centro donde se realizó el estudio."}', 
true, false, 110),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-09', 'Etapa Clínica', 
'{"es": "Consentimientos Informados", "en": "Informed Consents"}',
'{"es": "Consentimientos informados de al menos 20% de los sujetos participantes."}', 
true, true, 120),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-10', 'Etapa Clínica', 
'{"es": "Reporte de Eventos Adversos", "en": "Adverse Events Report"}',
'{"es": "Documentación y seguimiento de eventos adversos durante el estudio."}', 
true, false, 130),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-11', 'Etapa Clínica', 
'{"es": "Cuadernos CRF", "en": "CRF Case Report Forms"}',
'{"es": "Case Report Forms de al menos 20% de los voluntarios."}', 
true, true, 140);

-- Módulo 3: Etapa Analítica (Bioanalítica)
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-12', 'Etapa Analítica', 
'{"es": "Validación Método Bioanalítico", "en": "Bioanalytical Method Validation"}',
'{"es": "Validación completa del método bioanalítico utilizado."}', 
true, false, 200),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-13', 'Etapa Analítica', 
'{"es": "Validación de Limpieza", "en": "Cleaning Validation"}',
'{"es": "Validación de procedimientos de limpieza del laboratorio bioanalítico."}', 
true, false, 210),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-14', 'Etapa Analítica', 
'{"es": "Certificación Laboratorio Bioanalítico", "en": "Bioanalytical Lab Certification"}',
'{"es": "Certificación y acreditación del laboratorio que realizó los análisis."}', 
true, false, 220),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-15', 'Etapa Analítica', 
'{"es": "Cromatogramas Originales", "en": "Original Chromatograms"}',
'{"es": "Cromatogramas originales de al menos 20% de las muestras analizadas."}', 
true, true, 230),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-16', 'Etapa Analítica', 
'{"es": "Datos Crudos Bioanalíticos", "en": "Bioanalytical Raw Data"}',
'{"es": "Datos crudos completos de la fase bioanalítica."}', 
true, true, 240);

-- Módulo 4: Etapa Estadística
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-17', 'Etapa Estadística', 
'{"es": "Análisis Estadístico BE", "en": "BE Statistical Analysis"}',
'{"es": "Reporte completo del análisis estadístico de bioequivalencia."}', 
true, false, 300),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-18', 'Etapa Estadística', 
'{"es": "Intervalos de Confianza 90%", "en": "90% Confidence Intervals"}',
'{"es": "IC 90% para AUCt, AUCinf y Cmax dentro de 80-125%."}', 
true, false, 310),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-19', 'Etapa Estadística', 
'{"es": "Curvas Cp vs Tiempo", "en": "Cp vs Time Curves"}',
'{"es": "Curvas de concentración plasmática vs tiempo (lineal y logarítmica)."}', 
true, false, 320),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-20', 'Etapa Estadística', 
'{"es": "Datos Crudos Estadísticos", "en": "Statistical Raw Data"}',
'{"es": "Datos crudos en formato editable (Excel) para verificación."}', 
true, true, 330),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-21', 'Etapa Estadística', 
'{"es": "Validación Software Estadístico", "en": "Statistical Software Validation"}',
'{"es": "Validación del software utilizado para el análisis estadístico."}', 
true, false, 340);

-- Módulo 5: Bioexención In Vitro
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-22', 'Bioexención', 
'{"es": "Justificación de Bioexención", "en": "Biowaiver Justification"}',
'{"es": "Justificación para solicitar bioexención (BCS Clase I o III)."}', 
false, false, 400),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-23', 'Bioexención', 
'{"es": "Perfiles de Disolución Comparativos", "en": "Comparative Dissolution Profiles"}',
'{"es": "Perfiles comparativos entre producto test y referencia."}', 
false, false, 410),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-24', 'Bioexención', 
'{"es": "Resultados en pH 1.2, 4.5 y 6.8", "en": "Results at pH 1.2, 4.5 and 6.8"}',
'{"es": "Datos de disolución en los tres medios de pH requeridos."}', 
false, false, 420),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-25', 'Bioexención', 
'{"es": "Cálculo Factor de Similitud f₂", "en": "Similarity Factor f₂ Calculation"}',
'{"es": "Cálculo del factor f₂ demostrando similitud (≥50)."}', 
false, false, 430),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-26', 'Bioexención', 
'{"es": "Control Excipientes Críticos", "en": "Critical Excipients Control"}',
'{"es": "Evaluación de excipientes críticos para BCS Clase III."}', 
false, false, 440);

-- Módulo 6: Estudios Extranjeros
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-27', 'Estudios Extranjeros', 
'{"es": "Supervisión por ARAV", "en": "ARAV Supervision"}',
'{"es": "Evidencia de supervisión por FDA, EMA u otra ARAV reconocida."}', 
false, false, 500),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-28', 'Estudios Extranjeros', 
'{"es": "Certificación BPC Centro Extranjero", "en": "Foreign Center GCP Certification"}',
'{"es": "Certificación GCP del centro extranjero donde se realizó el estudio."}', 
false, false, 510),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-29', 'Estudios Extranjeros', 
'{"es": "Reconocimiento Autoridad de Origen", "en": "Origin Authority Recognition"}',
'{"es": "Reconocimiento de la autoridad sanitaria del país de origen del estudio."}', 
false, false, 520);

-- Módulo 7: Modificaciones / Fabricante Alterno
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-30', 'Modificaciones', 
'{"es": "Justificación Fabricante Alterno", "en": "Alternate Manufacturer Justification"}',
'{"es": "Justificación técnica para incorporación de fabricante alterno."}', 
false, false, 600),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-31', 'Modificaciones', 
'{"es": "Comparación Perfiles Disolución f₂", "en": "Dissolution Profiles Comparison f₂"}',
'{"es": "Perfiles de disolución comparativos entre fabricantes con f₂."}', 
false, false, 610),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-32', 'Modificaciones', 
'{"es": "Evaluación Impacto en Biodisponibilidad", "en": "Bioavailability Impact Assessment"}',
'{"es": "Evaluación del impacto del cambio en la biodisponibilidad del producto."}', 
false, false, 620);

-- Módulo 8: Riesgo Regulatorio
INSERT INTO checklist_items (id, template_id, code, module, title_i18n_json, description_i18n_json, required, allows_multiple_files, sort_order) VALUES
(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-33', 'Riesgo Regulatorio', 
'{"es": "Análisis Riesgo por Incumplimiento BE", "en": "BE Non-Compliance Risk Analysis"}',
'{"es": "Análisis interno de riesgos regulatorios por incumplimiento de BE."}', 
false, false, 700),

(gen_random_uuid(), 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f', 'F-34', 'Riesgo Regulatorio', 
'{"es": "Plan de Mitigación", "en": "Mitigation Plan"}',
'{"es": "Plan de mitigación considerando plazos ARCSA y Art. 141 LOS."}', 
false, false, 710);
