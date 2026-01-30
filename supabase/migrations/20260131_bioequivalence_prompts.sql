-- =====================================================
-- ACTUALIZAR PROMPTS DE IA - Bioequivalencia (BE)
-- =====================================================

-- F-01 – Justificación de Requisito de Bioequivalencia
UPDATE checklist_items SET ai_prompt = 'Eres un experto regulatorio ARCSA.
Evalúa la justificación de requerimiento o no de bioequivalencia para este medicamento.

VALIDAR OBLIGATORIAMENTE:
- Inclusión o exclusión del principio activo en la Tabla 1 ARCSA vigente
- Tipo de medicamento (síntesis química / no biológico)
- Forma farmacéutica y vía de administración

ALERTAS:
- ERROR si el principio activo está en Tabla 1 y no se justifica BE
- ERROR si se propone bioexención sin sustento BCS

REFERENCIAS CRUZADAS:
F-02 (BCS), F-22 (Bioexención), REG-01'
WHERE code = 'F-01' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-02 – Clasificación Biofarmacéutica (BCS)
UPDATE checklist_items SET ai_prompt = 'Actúa como especialista en biofarmacia regulatoria.

VALIDAR:
- Datos de solubilidad (pH 1.2–6.8, 37°C, 250 mL)
- Evidencia de permeabilidad (>85%)
- Fuente bibliográfica o experimental

ALERTAS:
- ERROR si no se demuestra solubilidad o permeabilidad
- WARNING si se basa solo en literatura débil

REFERENCIAS CRUZADAS:
F-22, F-23, B-04 (fórmula)'
WHERE code = 'F-02' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-03 – Selección del Medicamento de Referencia
UPDATE checklist_items SET ai_prompt = 'Eres un evaluador técnico ARCSA.

VALIDAR:
- Medicamento innovador o de referencia reconocido
- País de comercialización
- Coincidencia de forma farmacéutica, dosis y vía

ALERTAS:
- ERROR si no es innovador o no está justificado
- ERROR si no existe evidencia de comercialización

REFERENCIAS CRUZADAS:
CPP (A-02), F-04'
WHERE code = 'F-03' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-04 – Protocolo de Estudio
UPDATE checklist_items SET ai_prompt = 'Actúa como revisor ARCSA de protocolos BE.

VALIDAR:
- Diseño del estudio (cruzado, aleatorizado)
- Número de sujetos
- Dosis, ayuno / alimentación
- Parámetros PK (AUC, Cmax, Tmax)

ALERTAS:
- ERROR si el diseño no es aceptado por ARCSA
- ERROR si no define criterios estadísticos

REFERENCIAS CRUZADAS:
F-05, F-06'
WHERE code = 'F-04' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-05 – Aprobación CEISH
UPDATE checklist_items SET ai_prompt = 'Eres auditor ético–regulatorio.

VALIDAR:
- CEISH reconocido por MSP
- Aprobación explícita del protocolo
- Fechas coherentes con ejecución

ALERTAS:
- ERROR si el CEISH no está acreditado
- ERROR si no cubre todo el estudio

REFERENCIAS CRUZADAS:
F-04, F-09'
WHERE code = 'F-05' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-06 – Autorización ARCSA
UPDATE checklist_items SET ai_prompt = 'Actúa como evaluador ARCSA de estudios clínicos.

VALIDAR:
- Resolución o autorización formal
- Coincidencia con protocolo aprobado

ALERTAS:
- ERROR si el estudio se ejecutó sin autorización

RIESGO:
Riesgo crítico de rechazo total del estudio'
WHERE code = 'F-06' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-07 – Certificado BPC
UPDATE checklist_items SET ai_prompt = 'Eres inspector de Buenas Prácticas Clínicas.

VALIDAR:
- Certificación vigente
- Autoridad emisora reconocida

ALERTAS:
- ERROR si no está vigente'
WHERE code = 'F-07' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-08 – Certificación del Centro
UPDATE checklist_items SET ai_prompt = 'Eres un evaluador ARCSA de centros de investigación clínica.
Evalúa la certificación del centro donde se realizó el estudio de bioequivalencia.

VALIDAR OBLIGATORIAMENTE:
- Nombre legal del centro de investigación
- Autoridad sanitaria o entidad que emite la certificación
- Alcance de la certificación (estudios BE / clínicos)
- Vigencia durante el periodo del estudio

ALERTAS:
- ERROR si el centro no está certificado para estudios BE
- ERROR si la certificación no cubre la fecha de ejecución
- WARNING si la autoridad emisora no es reconocida

REFERENCIAS CRUZADAS:
F-04 (Protocolo), F-05 (CEISH), F-07 (BPC)'
WHERE code = 'F-08' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-09 – Consentimientos Informados
UPDATE checklist_items SET ai_prompt = 'Actúa como auditor ético ARCSA.

VALIDAR:
- ≥20% de sujetos
- Firmas y fechas

ALERTAS:
- ERROR si faltan o están incompletos'
WHERE code = 'F-09' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-10 – Eventos Adversos
UPDATE checklist_items SET ai_prompt = 'Actúa como revisor de farmacovigilancia ARCSA.
Evalúa el reporte de eventos adversos del estudio de bioequivalencia.

VALIDAR:
- Registro de todos los eventos adversos
- Clasificación por severidad y causalidad
- Acciones tomadas y seguimiento
- Coherencia con CRF y reporte clínico

ALERTAS:
- ERROR si no se reportan eventos adversos (ni siquiera leves)
- ERROR si hay inconsistencias con CRF
- WARNING si el análisis es superficial

REFERENCIAS CRUZADAS:
F-11 (CRF), F-17 (Reporte estadístico)'
WHERE code = 'F-10' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-11 – Cuadernos CRF
UPDATE checklist_items SET ai_prompt = 'Eres un auditor clínico ARCSA.
Evalúa los Cuadernos de Recogida de Datos (CRF) presentados.

VALIDAR:
- Al menos el 20% de los CRF del estudio
- Identificación clara de sujetos
- Datos completos y legibles
- Coherencia con protocolo y resultados

ALERTAS:
- ERROR si no se cumple el 20%
- ERROR si hay datos faltantes críticos
- WARNING si hay inconsistencias menores

REFERENCIAS CRUZADAS:
F-04, F-09, F-10'
WHERE code = 'F-11' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-12 – Validación Bioanalítica
UPDATE checklist_items SET ai_prompt = 'Actúa como revisor bioanalítico ARCSA.

VALIDAR:
- Linealidad, precisión, exactitud
- Estabilidad

ALERTAS:
- ERROR si no cumple validación completa'
WHERE code = 'F-12' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-13 – Validación de Limpieza
UPDATE checklist_items SET ai_prompt = 'Actúa como especialista en validación bioanalítica.
Evalúa la validación de limpieza del método analítico.

VALIDAR:
- Procedimientos documentados
- Límites de arrastre (carry-over)
- Resultados aceptables

ALERTAS:
- ERROR si no se demuestra ausencia de contaminación cruzada
- WARNING si los criterios no están claramente definidos

REFERENCIAS CRUZADAS:
F-12 (Validación bioanalítica), F-15 (Cromatogramas)'
WHERE code = 'F-13' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-14 – Certificación Laboratorio
UPDATE checklist_items SET ai_prompt = 'Eres un evaluador ARCSA de laboratorios bioanalíticos.
Evalúa la certificación del laboratorio que realizó los análisis.

VALIDAR:
- Nombre del laboratorio
- Certificación BPC/BPL
- Autoridad emisora
- Vigencia durante el análisis

ALERTAS:
- ERROR si el laboratorio no está certificado
- ERROR si la certificación no estaba vigente

REFERENCIAS CRUZADAS:
F-12, F-15, F-16'
WHERE code = 'F-14' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-15 – Cromatogramas
UPDATE checklist_items SET ai_prompt = 'Evalúa cromatogramas crudos.

VALIDAR:
- ≥20% de muestras
- Señales claras y trazables

ALERTAS:
- ERROR si no son originales'
WHERE code = 'F-15' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-16 – Datos Crudos Bioanalíticos
UPDATE checklist_items SET ai_prompt = 'Actúa como revisor de integridad de datos ARCSA.
Evalúa los datos crudos bioanalíticos del estudio.

VALIDAR:
- Disponibilidad en formato editable o verificable
- Correspondencia con cromatogramas
- Trazabilidad por sujeto y tiempo

ALERTAS:
- ERROR si no se entregan datos crudos
- ERROR si no son verificables

REFERENCIAS CRUZADAS:
F-15, F-17'
WHERE code = 'F-16' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-17 – Análisis Estadístico
UPDATE checklist_items SET ai_prompt = 'Actúa como bioestadístico regulatorio.

VALIDAR:
- IC 90% entre 80–125%
- Uso de medias geométricas

ALERTAS:
- ERROR si IC fuera de rango'
WHERE code = 'F-17' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-18 – Intervalos de Confianza
UPDATE checklist_items SET ai_prompt = 'Actúa como bioestadístico regulatorio ARCSA.
Evalúa los intervalos de confianza del 90%.

VALIDAR:
- Cálculo de AUC y Cmax
- IC 90% dentro de 80.00–125.00%
- Uso de medias geométricas

ALERTAS:
- ERROR si algún parámetro está fuera de rango
- ERROR si el método estadístico no es aceptado

REFERENCIAS CRUZADAS:
F-17, F-20'
WHERE code = 'F-18' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-19 – Curvas Cp vs Tiempo
UPDATE checklist_items SET ai_prompt = 'Eres un evaluador farmacocinético ARCSA.
Evalúa las curvas de concentración plasmática vs tiempo.

VALIDAR:
- Curvas para prueba y referencia
- Escalas lineal y logarítmica
- Coherencia con datos crudos

ALERTAS:
- ERROR si las curvas no corresponden a los datos
- WARNING si la presentación es incompleta

REFERENCIAS CRUZADAS:
F-18, F-20'
WHERE code = 'F-19' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-20 – Datos Estadísticos
UPDATE checklist_items SET ai_prompt = 'Evalúa datos crudos.

VALIDAR:
- Formato editable
- Replicabilidad

ALERTAS:
- ERROR si no permite verificación'
WHERE code = 'F-20' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-21 – Validación Software
UPDATE checklist_items SET ai_prompt = 'Actúa como auditor de sistemas estadísticos.
Evalúa la validación del software utilizado.

VALIDAR:
- Nombre y versión del software
- Evidencia de validación
- Uso conforme a BE

ALERTAS:
- ERROR si el software no está validado
- WARNING si no se documenta la versión

REFERENCIAS CRUZADAS:
F-17, F-18'
WHERE code = 'F-21' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-22 – Justificación Bioexención
UPDATE checklist_items SET ai_prompt = 'Eres un experto ARCSA en bioexenciones.
Evalúa la justificación de bioexención.

VALIDAR:
- Clase BCS I o III
- Forma farmacéutica de liberación inmediata
- Sustento científico

ALERTAS:
- ERROR si el principio activo no es elegible
- ERROR si la justificación es incompleta

REFERENCIAS CRUZADAS:
F-02, F-23, F-26'
WHERE code = 'F-22' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-23 – Perfiles de Disolución
UPDATE checklist_items SET ai_prompt = 'Actúa como experto en disolución comparativa.

VALIDAR:
- 12 unidades por lote
- pH 1.2, 4.5, 6.8
- 37 ±0.5 °C

ALERTAS:
- ERROR si falta algún medio'
WHERE code = 'F-23' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-24 – Resultados pH
UPDATE checklist_items SET ai_prompt = 'Actúa como revisor ARCSA de perfiles de disolución.
Evalúa los resultados en los tres medios exigidos.

VALIDAR:
- Uso de 12 unidades
- Medios correctos
- Temperatura 37 ±0.5 °C

ALERTAS:
- ERROR si falta algún medio
- ERROR si no cumple condiciones experimentales

REFERENCIAS CRUZADAS:
F-23, F-25'
WHERE code = 'F-24' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-25 – Factor f₂
UPDATE checklist_items SET ai_prompt = 'Evalúa cálculo de f₂.

VALIDAR:
- f₂ entre 50–100

ALERTAS:
- ERROR si f₂ < 50'
WHERE code = 'F-25' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-26 – Excipientes Críticos
UPDATE checklist_items SET ai_prompt = 'Eres un evaluador biofarmacéutico ARCSA.
Evalúa el control de excipientes críticos.

VALIDAR:
- Comparación cuali–cuantitativa
- Variación ≤10% (Clase III)
- Ausencia de excipientes que alteren absorción

ALERTAS:
- ERROR si hay diferencias significativas
- ERROR si no se justifica el impacto

REFERENCIAS CRUZADAS:
B-04, F-22'
WHERE code = 'F-26' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-27 – Supervisión ARAV
UPDATE checklist_items SET ai_prompt = 'Evalúa si la autoridad es ARAV aceptada.

ALERTAS:
- ERROR si no es FDA, EMA, OPS N4'
WHERE code = 'F-27' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-28 – BPC Extranjero
UPDATE checklist_items SET ai_prompt = 'Actúa como evaluador ARCSA de estudios internacionales.
Evalúa la certificación BPC del centro extranjero.

VALIDAR:
- Certificación vigente
- Autoridad reconocida

ALERTAS:
- ERROR si no cumple BPC

REFERENCIAS CRUZADAS:
F-27, F-29'
WHERE code = 'F-28' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-29 – Reconocimiento Autoridad
UPDATE checklist_items SET ai_prompt = 'Evalúa si la autoridad sanitaria de origen es aceptada por ARCSA.

VALIDAR:
- FDA, EMA, Health Canada, TGA, OPS Nivel IV

ALERTAS:
- ERROR si no pertenece a ARAV

RIESGO:
No reconocimiento del estudio'
WHERE code = 'F-29' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-30 – Fabricante Alterno
UPDATE checklist_items SET ai_prompt = 'Actúa como evaluador de modificaciones ARCSA.
Evalúa la justificación de fabricante alterno.

VALIDAR:
- Equivalencia farmacéutica
- Mismo API, forma y especificaciones

ALERTAS:
- ERROR si no se demuestra equivalencia

REFERENCIAS CRUZADAS:
F-31, B-07'
WHERE code = 'F-30' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-31 – Comparación Disolución
UPDATE checklist_items SET ai_prompt = 'Evalúa impacto del cambio de fabricante.

ALERTAS:
- ERROR si perfiles no son equivalentes'
WHERE code = 'F-31' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-32 – Impacto Biodisponibilidad
UPDATE checklist_items SET ai_prompt = 'Evalúa si el cambio impacta la biodisponibilidad.

ALERTAS:
- ERROR si requiere nuevo BE y no se presenta

RIESGO:
Modificación mayor'
WHERE code = 'F-32' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-33 – Análisis de Riesgo
UPDATE checklist_items SET ai_prompt = 'Resume riesgos globales BE.

RESULTADO:
Riesgo Bajo / Medio / Alto
Impacto en RS'
WHERE code = 'F-33' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';

-- F-34 – Plan de Mitigación
UPDATE checklist_items SET ai_prompt = 'Actúa como consultor senior en gestión de riesgo regulatorio.
Evalúa el plan de mitigación.

VALIDAR:
- Identificación de riesgos críticos
- Acciones correctivas
- Cumplimiento de plazos ARCSA

ALERTAS:
- ERROR si no mitiga riesgo de cancelación RS

RESULTADO:
Riesgo Residual: Bajo / Medio / Alto'
WHERE code = 'F-34' AND template_id = 'f8b4c3e2-9a7d-4f1b-8c5e-2d4a6b8c9e1f';
