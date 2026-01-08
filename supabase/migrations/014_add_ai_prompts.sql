-- =====================================================
-- MIGRACIÓN: Agregar prompts de IA por ítem de checklist
-- =====================================================

-- Agregar columna ai_prompt a checklist_items
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS ai_prompt TEXT;

-- Agregar columna ai_cross_references para referencias cruzadas
ALTER TABLE checklist_items 
ADD COLUMN IF NOT EXISTS ai_cross_references TEXT[];

-- Comentario explicativo
COMMENT ON COLUMN checklist_items.ai_prompt IS 'Prompt especializado para análisis IA de este tipo de documento';
COMMENT ON COLUMN checklist_items.ai_cross_references IS 'Códigos de otros ítems que deben cruzarse con este documento';

-- =====================================================
-- ACTUALIZAR PROMPTS PARA PLANTILLA: Medicamento Importado
-- Template ID: a0000000-0000-0000-0000-000000000001
-- =====================================================

-- A-01: Certificado BPM/GMP
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto regulatorio farmacéutico validando un Certificado de Buenas Prácticas de Manufactura (BPM/GMP).

VALIDAR OBLIGATORIAMENTE:
1. Autoridad sanitaria emisora (debe ser autoridad oficial del país de origen)
2. Nombre legal completo y dirección del fabricante
3. Forma farmacéutica cubierta por el certificado
4. Fecha de emisión y fecha de vencimiento explícita
5. Número de certificado o referencia oficial

CRITERIOS DE VIGENCIA:
- El certificado debe estar VIGENTE al momento del análisis
- Se recomienda mínimo 6 meses de vigencia restante
- Si vence en menos de 6 meses, generar WARNING

ALERTAS CRÍTICAS:
- ERROR si el BPM está vencido
- ERROR si la forma farmacéutica del producto no está cubierta
- WARNING si vence pronto (< 6 meses)
- WARNING si falta información del fabricante

REFERENCIAS CRUZADAS: Este documento debe coincidir con A-02 (CPP), B-07 (Proceso de manufactura), C-05 (Etiquetas)',
ai_cross_references = ARRAY['A-02', 'B-07', 'C-05']
WHERE code = 'A-01';

-- A-02: Certificado de Libre Venta (CPP/CLV)
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto regulatorio farmacéutico validando un Certificado de Libre Venta (CPP/CLV).

VALIDAR OBLIGATORIAMENTE:
1. Nombre exacto del producto medicinal
2. Forma farmacéutica (tabletas, cápsulas, inyectable, etc.)
3. Concentración del principio activo
4. Presentación comercial
5. Nombre del fabricante y del titular del registro
6. País emisor y autoridad sanitaria
7. Fecha de emisión y vencimiento

CRITERIOS DE VIGENCIA:
- Usualmente válido 1-2 años desde emisión
- Debe estar vigente al ingreso del trámite

ALERTAS CRÍTICAS:
- ERROR si el producto descrito no coincide con el esperado
- ERROR si el CPP está vencido
- WARNING si faltan datos de concentración o forma farmacéutica

REFERENCIAS CRUZADAS: Debe coincidir con B-04 (Fórmula), C-05 (Etiquetas), A-03 (Declaración titular)',
ai_cross_references = ARRAY['B-04', 'C-05', 'A-03']
WHERE code = 'A-02';

-- A-03: Declaración del Titular - Estado Regulatorio
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto regulatorio validando una Declaración del Titular sobre Estado Regulatorio Internacional.

VALIDAR OBLIGATORIAMENTE:
1. Identificación clara del titular del registro
2. Lista de países donde el producto está registrado
3. Estado vigente del registro en cada país mencionado
4. Firma del representante legal o responsable autorizado
5. Fecha de la declaración

CRITERIOS DE VIGENCIA:
- La declaración no debe tener más de 6 meses de antigüedad
- Debe reflejar el estado actual del producto

ALERTAS CRÍTICAS:
- ERROR si la declaración tiene más de 6 meses
- WARNING si no menciona países de registro
- WARNING si falta firma del responsable

REFERENCIAS CRUZADAS: Debe coincidir con A-02 (CPP), A-04 (Poder legal)',
ai_cross_references = ARRAY['A-02', 'A-04']
WHERE code = 'A-03';

-- A-04: Poder Legal / Autorización del Titular
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto regulatorio validando un Poder Legal o Autorización del Titular.

VALIDAR OBLIGATORIAMENTE:
1. Facultades explícitas para gestionar registro sanitario
2. Identificación clara del producto o productos autorizados
3. Datos del otorgante (titular) y del apoderado
4. Firma válida y legalizada/apostillada si aplica
5. Fecha del documento

CRITERIOS DE VIGENCIA:
- Debe estar vigente al momento del trámite
- Si no indica fecha de vencimiento, se acepta como indefinido
- Verificar que las facultades cubran "registro sanitario"

ALERTAS CRÍTICAS:
- ERROR si las facultades no incluyen registro sanitario
- ERROR si el poder está vencido (si tiene fecha límite)
- WARNING si el producto no está identificado claramente

REFERENCIAS CRUZADAS: Debe coincidir con A-03 (Declaración)',
ai_cross_references = ARRAY['A-03']
WHERE code = 'A-04';

-- B-01: Certificado de Análisis - Producto Terminado
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en control de calidad farmacéutico validando un Certificado de Análisis (CoA) de Producto Terminado.

VALIDAR OBLIGATORIAMENTE:
1. Número de lote real y fecha de fabricación
2. Fecha de análisis y fecha de vencimiento del lote
3. Todos los parámetros analizados vs especificaciones
4. Resultado de cumplimiento (CUMPLE/NO CUMPLE por parámetro)
5. Firma del responsable de control de calidad
6. Nombre del laboratorio que realizó el análisis

CRITERIOS DE VIGENCIA:
- El lote analizado NO debe estar vencido
- El CoA debe corresponder a un lote representativo

ALERTAS CRÍTICAS:
- ERROR si el lote está vencido
- ERROR si algún parámetro NO CUMPLE especificación
- WARNING si faltan parámetros críticos (valoración, disolución, etc.)

REFERENCIAS CRUZADAS: Debe coincidir con B-03 (Especificaciones), B-09 (Métodos), C-03 (Cromatogramas), B-10 (Código lote)',
ai_cross_references = ARRAY['B-03', 'B-09', 'C-03', 'B-10']
WHERE code = 'B-01';

-- B-02: CoA Materias Primas / API
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en control de calidad validando Certificados de Análisis de Materias Primas y API (Ingrediente Farmacéutico Activo).

VALIDAR OBLIGATORIAMENTE:
1. Nombre del API o materia prima
2. Referencia a farmacopea (USP, BP, EP, etc.)
3. Fabricante del API con datos completos
4. Número de lote del API
5. Todos los parámetros de pureza y calidad
6. Cumplimiento de especificaciones

CRITERIOS:
- No aplica vigencia específica, pero el lote debe ser trazable
- El API debe coincidir con la fórmula declarada

ALERTAS CRÍTICAS:
- ERROR si el API no corresponde al declarado en fórmula
- WARNING si falta referencia farmacopeica
- WARNING si falta información del fabricante del API

REFERENCIAS CRUZADAS: Debe coincidir con B-04 (Fórmula), B-06 (Excipientes)',
ai_cross_references = ARRAY['B-04', 'B-06']
WHERE code = 'B-02';

-- B-03: Especificaciones de Calidad
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en calidad farmacéutica validando Especificaciones de Calidad de Producto Terminado.

VALIDAR OBLIGATORIAMENTE:
1. Todos los parámetros críticos de calidad
2. Límites de aceptación para cada parámetro
3. Referencia a farmacopea o método interno
4. Parámetros mínimos: identificación, valoración, disolución, uniformidad, impurezas
5. Versión y fecha del documento

CRITERIOS:
- Debe ser la versión vigente del documento
- Los límites deben ser técnicamente justificables

ALERTAS CRÍTICAS:
- WARNING si faltan parámetros críticos
- WARNING si no hay referencia farmacopeica
- WARNING si el documento no tiene fecha/versión

REFERENCIAS CRUZADAS: Debe coincidir con B-01 (CoA), B-09 (Métodos), C-01 (Estabilidad)',
ai_cross_references = ARRAY['B-01', 'B-09', 'C-01']
WHERE code = 'B-03';

-- B-04: Fórmula Cualicuantitativa
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en formulación farmacéutica validando la Fórmula Cualicuantitativa Completa.

VALIDAR OBLIGATORIAMENTE:
1. Composición 100% declarada (API + excipientes = total)
2. Cantidades en unidades del Sistema Internacional (mg, g, mL)
3. Correspondencia exacta con la presentación comercial
4. Función de cada componente (activo, excipiente, colorante)
5. Todos los ingredientes deben estar listados

CRITERIOS:
- La suma de componentes debe dar 100% o peso total declarado
- Debe corresponder a la forma farmacéutica

ALERTAS CRÍTICAS:
- ERROR si la composición no suma 100%
- ERROR si la fórmula no coincide con etiqueta
- WARNING si faltan funciones de excipientes

REFERENCIAS CRUZADAS: Debe coincidir con B-02 (CoA API), B-06 (Excipientes), C-05 (Etiquetas), A-02 (CPP)',
ai_cross_references = ARRAY['B-02', 'B-06', 'C-05', 'A-02']
WHERE code = 'B-04';

-- B-05: Justificación de la Fórmula
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en desarrollo farmacéutico validando la Justificación de la Fórmula Cualitativa.

VALIDAR OBLIGATORIAMENTE:
1. Función tecnológica de cada excipiente
2. Justificación de la selección de cada componente
3. Compatibilidad entre componentes
4. Referencias bibliográficas o estudios de soporte

CRITERIOS:
- Cada excipiente debe tener una función clara
- Debe ser coherente con el proceso de manufactura

ALERTAS CRÍTICAS:
- WARNING si faltan justificaciones para excipientes
- WARNING si no hay referencias de compatibilidad

REFERENCIAS CRUZADAS: Debe coincidir con B-04 (Fórmula), B-07 (Proceso)',
ai_cross_references = ARRAY['B-04', 'B-07']
WHERE code = 'B-05';

-- B-06: Declaración de Excipientes y Colorantes
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto regulatorio validando la Declaración de Excipientes y Colorantes.

VALIDAR OBLIGATORIAMENTE:
1. Lista completa de excipientes utilizados
2. Colorantes con código CI (Color Index) o nombre oficial
3. Verificar que sean excipientes permitidos por ARCSA
4. Cantidades o rangos si aplica

CRITERIOS:
- Todos los colorantes deben estar autorizados
- Los excipientes deben coincidir con la fórmula

ALERTAS CRÍTICAS:
- ERROR si hay colorantes no autorizados
- WARNING si la lista no coincide con la fórmula

REFERENCIAS CRUZADAS: Debe coincidir con B-04 (Fórmula), C-05 (Etiquetas)',
ai_cross_references = ARRAY['B-04', 'C-05']
WHERE code = 'B-06';

-- B-07: Proceso de Manufactura
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en manufactura farmacéutica validando la Descripción del Proceso de Manufactura.

VALIDAR OBLIGATORIAMENTE:
1. Todas las etapas del proceso de fabricación
2. Parámetros críticos de proceso (temperatura, tiempo, velocidad)
3. Controles en proceso (IPC)
4. Equipos principales utilizados
5. Puntos de control de calidad

CRITERIOS:
- El proceso debe ser completo desde materias primas hasta producto terminado
- Debe ser coherente con la forma farmacéutica

ALERTAS CRÍTICAS:
- WARNING si faltan etapas críticas
- WARNING si no hay controles en proceso
- WARNING si falta información de parámetros críticos

REFERENCIAS CRUZADAS: Debe coincidir con A-01 (BPM), B-08 (Flujograma), B-09 (Métodos)',
ai_cross_references = ARRAY['A-01', 'B-08', 'B-09']
WHERE code = 'B-07';

-- B-08: Flujograma del Proceso
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en manufactura validando el Flujograma del Proceso de Manufactura.

VALIDAR OBLIGATORIAMENTE:
1. Secuencia lógica de operaciones
2. Todas las etapas representadas gráficamente
3. Puntos de control de calidad identificados
4. Flujo de materiales claro
5. Coherencia con la descripción escrita del proceso

CRITERIOS:
- Debe ser legible y completo
- Debe coincidir con B-07

ALERTAS CRÍTICAS:
- WARNING si el flujograma está incompleto
- WARNING si no coincide con la descripción del proceso

REFERENCIAS CRUZADAS: Debe coincidir con B-07 (Proceso)',
ai_cross_references = ARRAY['B-07']
WHERE code = 'B-08';

-- B-09: Metodología Analítica / Validación
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en validación analítica evaluando la Metodología Analítica y su Validación.

VALIDAR OBLIGATORIAMENTE:
1. Métodos analíticos para cada parámetro de especificación
2. Parámetros de validación: especificidad, linealidad, precisión, exactitud
3. Criterios de aceptación para cada parámetro de validación
4. Resultados de la validación
5. Referencia a farmacopea si el método es oficial

CRITERIOS:
- Los métodos deben estar validados según ICH Q2
- Debe haber método para cada parámetro del CoA

ALERTAS CRÍTICAS:
- WARNING si faltan parámetros de validación
- WARNING si los métodos no están validados

REFERENCIAS CRUZADAS: Debe coincidir con B-01 (CoA), B-03 (Especificaciones), C-03 (Cromatogramas)',
ai_cross_references = ARRAY['B-01', 'B-03', 'C-03']
WHERE code = 'B-09';

-- B-10: Interpretación del Código de Lote
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en trazabilidad farmacéutica validando la Interpretación del Código de Lote.

VALIDAR OBLIGATORIAMENTE:
1. Explicación completa de cada dígito/letra del código
2. Información de trazabilidad: fecha, línea, turno
3. Ejemplo práctico con un lote real
4. Sistema de codificación claro y reproducible

CRITERIOS:
- Debe permitir trazabilidad completa del lote
- El ejemplo debe coincidir con lotes presentados en otros documentos

ALERTAS CRÍTICAS:
- WARNING si la interpretación es incompleta
- WARNING si no hay ejemplo práctico

REFERENCIAS CRUZADAS: Debe coincidir con B-01 (CoA), C-01 (Estabilidad)',
ai_cross_references = ARRAY['B-01', 'C-01']
WHERE code = 'B-10';

-- B-11: Envase Primario y Secundario
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en acondicionamiento farmacéutico validando la Descripción de Envase Primario y Secundario.

VALIDAR OBLIGATORIAMENTE:
1. Material del envase primario (blíster, frasco, ampolla)
2. Material del envase secundario (caja, estuche)
3. Especificaciones técnicas de cada material
4. Compatibilidad con el producto
5. Certificados o fichas técnicas de materiales

CRITERIOS:
- Los materiales deben ser compatibles con la forma farmacéutica
- Debe coincidir con lo declarado en etiquetas

ALERTAS CRÍTICAS:
- WARNING si falta información de compatibilidad
- WARNING si no hay especificaciones de materiales

REFERENCIAS CRUZADAS: Debe coincidir con C-01 (Estabilidad), C-05 (Etiquetas)',
ai_cross_references = ARRAY['C-01', 'C-05']
WHERE code = 'B-11';

-- C-01: Estudios de Estabilidad
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en estabilidad farmacéutica validando Estudios de Estabilidad.

VALIDAR OBLIGATORIAMENTE:
1. Condiciones de estudio: Zona climática IVb (30°C/75%HR) para largo plazo
2. Condiciones aceleradas: 40°C/75%HR
3. Tiempos de muestreo completos
4. Parámetros evaluados en cada tiempo
5. Resultados dentro de especificación
6. Lotes utilizados en el estudio

CRITERIOS:
- Debe soportar la vida útil declarada
- Mínimo 6 meses acelerado + 12 meses largo plazo para nuevo registro

ALERTAS CRÍTICAS:
- ERROR si las condiciones no corresponden a Zona IVb
- ERROR si los resultados están fuera de especificación
- WARNING si el estudio está incompleto

REFERENCIAS CRUZADAS: Debe coincidir con B-11 (Envase), C-02 (Vida útil), C-05 (Etiquetas)',
ai_cross_references = ARRAY['B-11', 'C-02', 'C-05']
WHERE code = 'C-01';

-- C-02: Protocolo y Conclusión de Vida Útil
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en estabilidad validando el Protocolo de Estabilidad y Conclusión de Vida Útil.

VALIDAR OBLIGATORIAMENTE:
1. Justificación técnica de la vida útil propuesta
2. Condiciones de almacenamiento recomendadas
3. Firma del responsable técnico
4. Coherencia con los estudios de estabilidad
5. Vida útil en meses/años claramente establecida

CRITERIOS:
- La vida útil debe estar respaldada por datos de estabilidad
- Debe coincidir con lo declarado en etiquetas

ALERTAS CRÍTICAS:
- ERROR si la vida útil no está respaldada por estudios
- WARNING si falta firma del responsable

REFERENCIAS CRUZADAS: Debe coincidir con C-01 (Estudios), C-05 (Etiquetas)',
ai_cross_references = ARRAY['C-01', 'C-05']
WHERE code = 'C-02';

-- C-03: Cromatogramas / Registros Analíticos
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en análisis instrumental validando Cromatogramas y Registros Analíticos.

VALIDAR OBLIGATORIAMENTE:
1. Integridad de los datos (no manipulados)
2. Identificación de picos principales
3. Parámetros cromatográficos (tiempo de retención, área, resolución)
4. Fecha y hora del análisis
5. Identificación del equipo utilizado
6. Firma o código del analista

CRITERIOS:
- Los cromatogramas deben ser legibles
- Deben corresponder a los métodos declarados

ALERTAS CRÍTICAS:
- WARNING si hay indicios de manipulación
- WARNING si los cromatogramas no son legibles

REFERENCIAS CRUZADAS: Debe coincidir con B-09 (Métodos), B-01 (CoA)',
ai_cross_references = ARRAY['B-09', 'B-01']
WHERE code = 'C-03';

-- C-04: Soporte Clínico / Farmacológico
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto en asuntos regulatorios validando Documentación de Soporte Clínico y Farmacológico.

VALIDAR OBLIGATORIAMENTE:
1. El principio activo debe estar aprobado internacionalmente
2. Referencias bibliográficas válidas y actualizadas
3. Indicaciones terapéuticas soportadas
4. Dosis y posología justificadas
5. Perfil de seguridad documentado

CRITERIOS:
- Para productos conocidos, basta bibliografía de referencia
- Para productos nuevos, se requieren estudios clínicos

ALERTAS CRÍTICAS:
- WARNING si las referencias son muy antiguas (>10 años sin actualización)
- WARNING si falta información de seguridad

REFERENCIAS CRUZADAS: Debe coincidir con la Fórmula y la Indicación Terapéutica declarada',
ai_cross_references = ARRAY['B-04']
WHERE code = 'C-04';

-- C-05: Etiquetas Originales
UPDATE checklist_items SET 
ai_prompt = 'Eres un experto regulatorio validando Etiquetas Originales del País de Origen.

VALIDAR OBLIGATORIAMENTE:
1. Nombre del producto medicinal
2. Forma farmacéutica
3. Concentración del principio activo
4. Nombre y dirección del fabricante
5. Vida útil o fecha de vencimiento
6. Condiciones de almacenamiento
7. Número de lote (espacio para)
8. Contenido del envase

⚠️ VALIDACIÓN CRÍTICA - CRUCE CON TODO EL EXPEDIENTE:
Esta etiqueta debe coincidir con TODOS los demás documentos del dossier.

ALERTAS CRÍTICAS:
- ERROR si el nombre del producto no coincide con CPP
- ERROR si la concentración no coincide con la fórmula
- ERROR si el fabricante no coincide con BPM
- ERROR si la vida útil no coincide con estudios de estabilidad
- WARNING por cualquier inconsistencia menor

REFERENCIAS CRUZADAS: Debe coincidir con TODO el expediente (A-01, A-02, B-04, C-01, C-02, etc.)',
ai_cross_references = ARRAY['A-01', 'A-02', 'B-04', 'C-01', 'C-02']
WHERE code = 'C-05';
