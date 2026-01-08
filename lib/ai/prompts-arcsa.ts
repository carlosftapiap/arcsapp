/**
 * ARQUITECTURA DE PROMPTS POR CAPAS PARA ANÁLISIS ARCSA
 * 
 * Capa 0: System Prompt (siempre incluido)
 * Capa 1: Contexto de Etapa (dinámico)
 * Capa 2: Clasificación de Archivos (universal)
 * Capa 3: Prompts Específicos por Etapa Multi-archivo
 * Capa 4: Validación Cruzada Global
 * Capa 5: Formato de Salida
 */

// ============================================================================
// CAPA 0 - SYSTEM PROMPT BASE (OBLIGATORIO)
// ============================================================================
export const SYSTEM_PROMPT_ARCSA = `Eres un asistente experto en evaluación técnica de expedientes de Registro Sanitario ARCSA Ecuador para medicamentos en general de uso humano.

Debes:
- Analizar expedientes completos, no documentos aislados
- Reconocer que algunos ítems ARCSA admiten múltiples archivos
- Clasificar cada archivo según su función regulatoria
- Validar consistencia cruzada entre documentos y entre etapas
- Reportar errores y observaciones con criterio ARCSA

Reglas críticas:
- B-02, B-09, C-01, C-03 y C-05 admiten múltiples archivos
- La ausencia o inconsistencia de documentos críticos genera error
- No asumas información no contenida explícitamente en los documentos

REGLA DE ORO:
Si una etapa ARCSA admite múltiples archivos, la ausencia de uno no invalida a los demás,
pero la ausencia de un archivo crítico invalida la etapa completa.`;

// ============================================================================
// CAPA 1 - CONTEXTO DE ETAPA (DINÁMICO)
// ============================================================================
export interface StageContext {
    code: string;
    name: string;
    isMultiFile: boolean;
    description: string;
    module: string;
}

export function buildStageContextPrompt(context: StageContext): string {
    return `
=== CONTEXTO DE ETAPA ARCSA ===
Código: ${context.code}
Nombre: ${context.name}
Módulo: ${context.module}
Tipo: ${context.isMultiFile ? 'MULTI-ARCHIVO' : 'ARCHIVO ÚNICO'}
Admite múltiples archivos: ${context.isMultiFile ? 'Sí' : 'No'}

Descripción: ${context.description}

Instrucciones específicas:
${context.isMultiFile ? `
- Analiza CADA archivo de forma INDIVIDUAL primero
- NO marques como duplicado documentos que correspondan a diferentes materias primas, lotes o tiempos
- Agrupa los hallazgos por: API, lote, tiempo, o presentación según corresponda
- Prepara los datos para validación cruzada con otras etapas
` : `
- Analiza el documento como archivo único
- Verifica que contenga toda la información requerida para esta etapa
- Identifica si falta información crítica
`}`;
}

// ============================================================================
// CAPA 2 - CLASIFICACIÓN DE ARCHIVOS (UNIVERSAL)
// ============================================================================
export const FILE_CLASSIFICATION_PROMPT = `
=== CLASIFICACIÓN DE ARCHIVO ===
Para el archivo proporcionado, identifica:

1. TIPO DE DOCUMENTO:
   - CoA producto terminado
   - CoA API (principio activo)
   - CoA excipiente / colorante / conservante
   - Método analítico / validación
   - Estudio de estabilidad (acelerada/larga duración)
   - Cromatograma / registro analítico
   - Etiqueta (primaria/secundaria/inserto)
   - Certificado BPM/GMP
   - Certificado CPP/CLV
   - Documento legal (poder, declaración)
   - Fórmula cualicuantitativa
   - Especificaciones de calidad
   - Proceso de manufactura / flujograma
   - Otro (especificar)

2. DATOS CLAVE EXTRAÍDOS:
   - API asociado (si aplica): nombre y sal
   - Lote asociado (si aplica): número
   - Fabricante: nombre y país
   - Fecha de emisión
   - Fecha de vencimiento (si aplica)
   - Tiempo de estabilidad (si aplica): 0, 3, 6, 9, 12 meses, etc.
   - Presentación asociada (si aplica)

3. ETAPA ARCSA SUGERIDA:
   - A qué código de etapa corresponde (A-01, B-02, C-01, etc.)
`;

// ============================================================================
// CAPA 3 - PROMPTS ESPECÍFICOS POR ETAPA
// ============================================================================
export const STAGE_SPECIFIC_PROMPTS: Record<string, string> = {
    // ========== MÓDULO A - LEGAL ==========
    'A-01': `
=== EVALUACIÓN A-01: CERTIFICADO BPM/GMP ===
Verifica:
1. Certificado emitido por autoridad sanitaria reconocida
2. Vigencia del certificado (no vencido)
3. Alcance: formas farmacéuticas cubiertas
4. Fabricante y dirección coinciden con declaraciones
5. Si hay anexos, verificar coherencia

Alertas críticas:
- Certificado vencido = ERROR CRÍTICO
- Forma farmacéutica del producto no cubierta = ERROR CRÍTICO
- Fabricante diferente al declarado = ERROR CRÍTICO
`,

    'A-02': `
=== EVALUACIÓN A-02: CPP / CLV ===
Verifica:
1. Certificado de Producto Farmacéutico (OMS) o Libre Venta
2. Vigencia del certificado
3. Producto específico mencionado
4. País de origen y autoridad emisora
5. Estado de comercialización en país de origen

Alertas críticas:
- Certificado vencido = ERROR CRÍTICO
- Producto no coincide = ERROR CRÍTICO
`,

    'A-03': `
=== EVALUACIÓN A-03: DECLARACIÓN DEL TITULAR ===
Verifica:
1. Declaración firmada por representante legal
2. Estado regulatorio internacional del producto
3. Países donde está registrado/rechazado/retirado
4. Razones de retiro si aplica

Alertas:
- Producto retirado por seguridad en otro país = ERROR CRÍTICO
`,

    'A-04': `
=== EVALUACIÓN A-04: PODER LEGAL ===
Verifica:
1. Poder notariado válido
2. Autorización para trámites ante ARCSA Ecuador
3. Vigencia del poder
4. Representante legal identificado

Alertas:
- Poder vencido = ERROR CRÍTICO
- Sin autorización explícita para ARCSA = OBSERVACIÓN
`,

    // ========== MÓDULO B - CALIDAD ==========
    'B-01': `
=== EVALUACIÓN B-01: CoA PRODUCTO TERMINADO ===
Verifica:
1. Certificado de Análisis de lote representativo
2. Ensayos para CADA API declarado en fórmula
3. Cumplimiento de especificaciones
4. Lote, fecha de fabricación, fecha de vencimiento
5. Laboratorio que emite el CoA

Cruces obligatorios:
- APIs evaluados deben coincidir con B-04 (fórmula)
- Métodos deben ser consistentes con B-09
- Especificaciones deben coincidir con B-03

Alertas:
- Falta ensayo de un API = ERROR CRÍTICO
- Resultado fuera de especificación = ERROR CRÍTICO
- Lote diferente al de estabilidad = OBSERVACIÓN
`,

    'B-02': `
=== EVALUACIÓN B-02: CoA MATERIAS PRIMAS / API (MULTI-ARCHIVO) ===
Esta etapa REQUIERE múltiples archivos.

Para CADA archivo, identifica:
1. Tipo: CoA de API, colorante, conservante, o excipiente
2. Nombre de la materia prima y especificación
3. Fabricante/proveedor
4. Lote y fechas
5. Parámetros analíticos y cumplimiento

Validación del conjunto:
- DEBE existir al menos 1 CoA por CADA API declarado en B-04
- DEBE existir CoA para CADA colorante declarado en B-06
- DEBE existir CoA para CADA conservante declarado en B-06
- Excipientes críticos DEBEN tener CoA

Resultado esperado:
{
    "materias_detectadas": [
        { "nombre": "...", "tipo": "API|colorante|conservante|excipiente", "coa_presente": true/false }
    ],
    "apis_declarados_vs_coas": { "declarados": [], "con_coa": [], "sin_coa": [] },
    "colorantes_declarados_vs_coas": { "declarados": [], "con_coa": [], "sin_coa": [] },
    "conservantes_declarados_vs_coas": { "declarados": [], "con_coa": [], "sin_coa": [] },
    "riesgo_regulatorio": "ALTO|MEDIO|BAJO"
}

Alertas:
- API sin CoA = ERROR CRÍTICO
- Colorante sin CoA = ERROR CRÍTICO
- Conservante sin CoA = OBSERVACIÓN (según criticidad)
`,

    'B-03': `
=== EVALUACIÓN B-03: ESPECIFICACIONES DE CALIDAD ===
Verifica:
1. Especificaciones completas del producto terminado
2. Parámetros para CADA API (ensayo, límites)
3. Parámetros físicos (pH, viscosidad, etc. según forma)
4. Límites de impurezas y degradantes
5. Referencia a farmacopea si aplica

Cruces:
- Parámetros deben coincidir con B-01 (CoA PT)
- Límites de API deben ser coherentes con B-04 (fórmula)
`,

    'B-04': `
=== EVALUACIÓN B-04: FÓRMULA CUALICUANTITATIVA ===
Verifica:
1. Lista completa de APIs con cantidades y equivalencias
2. Lista de excipientes con cantidades y función
3. Colorantes y conservantes declarados
4. Unidad de dosificación clara
5. Sobrellenado si aplica

Extrae para validación cruzada:
{
    "apis": [{ "nombre": "...", "sal": "...", "cantidad": "...", "equivalencia": "..." }],
    "excipientes": [{ "nombre": "...", "cantidad": "...", "funcion": "..." }],
    "colorantes": ["..."],
    "conservantes": ["..."]
}

Cruces obligatorios:
- Cada API aquí DEBE tener CoA en B-02
- Colorantes aquí DEBEN estar en B-06
- Cantidades deben ser coherentes con B-03
`,

    'B-05': `
=== EVALUACIÓN B-05: JUSTIFICACIÓN DE LA FÓRMULA ===
Verifica:
1. Justificación de cada excipiente
2. Justificación de la combinación (si es FDC)
3. Justificación de la forma farmacéutica
4. Referencias bibliográficas si aplica
`,

    'B-06': `
=== EVALUACIÓN B-06: DECLARACIÓN DE EXCIPIENTES/COLORANTES ===
Verifica:
1. Lista de excipientes con función
2. Colorantes permitidos según normativa
3. Conservantes y justificación
4. Declaración de ausencia de ingredientes prohibidos

Cruces:
- Debe coincidir con B-04
`,

    'B-07': `
=== EVALUACIÓN B-07: PROCESO DE MANUFACTURA (MULTI-ARCHIVO POSIBLE) ===
Verifica:
1. Descripción narrativa del proceso
2. Etapas críticas identificadas
3. Parámetros de proceso (temperatura, tiempo, etc.)
4. Controles en proceso
5. SOPs relevantes si se incluyen

Para múltiples archivos:
- Pueden ser descripción + SOPs
- Verificar coherencia entre documentos
`,

    'B-08': `
=== EVALUACIÓN B-08: FLUJOGRAMA DEL PROCESO (MULTI-ARCHIVO POSIBLE) ===
Verifica:
1. Flujograma claro y completo
2. Coherencia con B-07 (descripción)
3. Puntos de control identificados
4. Materiales de entrada y salida

Para múltiples archivos:
- Pueden ser flujogramas por área
- Verificar que cubran todo el proceso
`,

    'B-09': `
=== EVALUACIÓN B-09: METODOLOGÍA ANALÍTICA (MULTI-ARCHIVO) ===
Esta etapa puede tener múltiples archivos.

Para CADA archivo, identifica:
1. Tipo: Método de identificación, ensayo, disolución, impurezas
2. API al que aplica
3. Técnica analítica (HPLC, UV, etc.)
4. Estado de validación
5. Parámetros de validación (exactitud, precisión, etc.)

Validación del conjunto:
- CADA API debe tener al menos: identificación + ensayo
- Métodos deben ser coherentes con B-01 y B-03
- Puede haber método combinado para múltiples APIs

Resultado:
{
    "metodos_por_api": {
        "API_1": { "identificacion": true/false, "ensayo": true/false, "impurezas": true/false },
        "API_2": { ... }
    },
    "metodos_validados": true/false,
    "consistencia_con_coa": "..."
}
`,

    'B-10': `
=== EVALUACIÓN B-10: CÓDIGO DE LOTE ===
Verifica:
1. SOP de numeración de lotes
2. Estructura del código explicada
3. Trazabilidad garantizada
`,

    'B-11': `
=== EVALUACIÓN B-11: ENVASE PRIMARIO/SECUNDARIO ===
Verifica:
1. Descripción de materiales de empaque
2. Especificaciones de materiales
3. Compatibilidad con el producto
4. Coherencia con estudios de estabilidad C-01
`,

    // ========== MÓDULO C - ESTABILIDAD/EFICACIA ==========
    'C-01': `
=== EVALUACIÓN C-01: ESTUDIOS DE ESTABILIDAD (MULTI-ARCHIVO) ===
Esta etapa REQUIERE múltiples archivos típicamente.

Para CADA archivo, identifica:
1. Tipo de estudio: Acelerada / Larga duración / Intermedia
2. Condiciones: temperatura y humedad
3. Lote(s) evaluado(s)
4. Tiempos de muestreo (0, 3, 6, 9, 12... meses)
5. Parámetros evaluados por API
6. Resultados y tendencias

Validación del conjunto:
- DEBE existir estabilidad acelerada O larga duración (mínimo)
- CADA API debe ser evaluado individualmente
- Lotes deben ser coherentes con B-01 y B-10
- Condiciones de almacenamiento deben soportar C-02

Resultado:
{
    "estudios": [
        { "tipo": "acelerada|larga|intermedia", "lote": "...", "tiempos": [...], "apis_evaluados": [...] }
    ],
    "cobertura_apis": { "declarados": [], "evaluados": [], "sin_evaluar": [] },
    "vida_util_soportada": "... meses",
    "condiciones_almacenamiento": "..."
}

Alertas:
- API no evaluado en estabilidad = ERROR CRÍTICO
- Resultado fuera de especificación = ERROR CRÍTICO
- Solo estabilidad acelerada = OBSERVACIÓN
`,

    'C-02': `
=== EVALUACIÓN C-02: PROTOCOLO Y CONCLUSIÓN DE VIDA ÚTIL ===
Verifica:
1. Protocolo de estabilidad definido
2. Conclusión de vida útil justificada
3. Coherencia con datos de C-01
4. Condiciones de almacenamiento propuestas
5. Fecha de re-análisis si aplica

Cruces:
- Vida útil debe estar soportada por C-01
- Condiciones deben coincidir con etiquetas C-05
`,

    'C-03': `
=== EVALUACIÓN C-03: CROMATOGRAMAS / REGISTROS (MULTI-ARCHIVO) ===
Esta etapa REQUIERE múltiples archivos.

Para CADA archivo, identifica:
1. Tipo: Cromatograma de ensayo, impurezas, disolución
2. API al que corresponde
3. Lote analizado
4. Método utilizado
5. Fecha de análisis

Validación del conjunto:
- CADA API debe tener cromatogramas
- Métodos deben coincidir con B-09
- Lotes deben ser trazables a B-01 y C-01

Resultado:
{
    "cromatogramas_por_api": {
        "API_1": { "ensayo": [...], "impurezas": [...] },
        "API_2": { ... }
    },
    "metodos_asociados": ["..."],
    "lotes_analizados": ["..."]
}
`,

    'C-04': `
=== EVALUACIÓN C-04: SOPORTE CLÍNICO/FARMACOLÓGICO ===
Verifica:
1. Bibliografía de soporte
2. Justificación de eficacia
3. Para combinaciones: justificación de dosis fija
4. Referencias a guías o farmacopeas
`,

    'C-05': `
=== EVALUACIÓN C-05: ETIQUETAS (MULTI-ARCHIVO) ===
Esta etapa REQUIERE múltiples archivos.

Para CADA archivo, identifica:
1. Tipo: Etiqueta primaria, secundaria, inserto/prospecto
2. Presentación asociada
3. Información del producto

Validación del conjunto:
- DEBEN existir: primaria + secundaria + inserto (mínimo)
- DEBEN cubrir todas las presentaciones
- Información DEBE coincidir con:

Cruces obligatorios:
- Composición = B-04
- Vida útil = C-02
- Condiciones de almacenamiento = C-01/C-02
- Fabricante = A-01

Resultado:
{
    "etiquetas_detectadas": [
        { "tipo": "primaria|secundaria|inserto", "presentacion": "..." }
    ],
    "presentaciones_cubiertas": ["..."],
    "consistencia_formula": true/false,
    "consistencia_vida_util": true/false
}

Alertas:
- Falta etiqueta primaria = ERROR CRÍTICO
- Composición no coincide con fórmula = ERROR CRÍTICO
- Vida útil diferente a C-02 = ERROR CRÍTICO
`
};

// ============================================================================
// CAPA 4 - VALIDACIÓN CRUZADA GLOBAL
// ============================================================================
export const CROSS_VALIDATION_PROMPT = `
=== VALIDACIÓN CRUZADA GLOBAL ARCSA ===

Realiza validación cruzada entre TODAS las etapas evaluadas del expediente.

CRUCES OBLIGATORIOS:

1. B-04 ↔ B-02 (Fórmula vs CoA Materias Primas)
   - Cada API en fórmula debe tener CoA
   - Cada colorante/conservante debe tener CoA

2. B-01 ↔ B-04 (CoA Producto Terminado vs Fórmula)
   - Ensayos de cada API declarado
   - Cantidades coherentes

3. B-01 ↔ B-09 (CoA vs Métodos)
   - Métodos del CoA deben estar validados en B-09

4. B-01 ↔ B-03 (CoA vs Especificaciones)
   - Resultados dentro de especificaciones

5. C-01 ↔ B-04 (Estabilidad vs Fórmula)
   - Cada API evaluado en estabilidad

6. C-01 ↔ B-11 (Estabilidad vs Envase)
   - Envase de estabilidad = envase comercial

7. C-01 ↔ C-02 (Estabilidad vs Vida Útil)
   - Datos soportan vida útil declarada

8. C-05 ↔ B-04 (Etiquetas vs Fórmula)
   - Composición coincide

9. C-05 ↔ C-02 (Etiquetas vs Vida Útil)
   - Vida útil coincide

10. A-01 ↔ B-04 (GMP vs Producto)
    - Forma farmacéutica cubierta por GMP

CLASIFICACIÓN DE HALLAZGOS:
- CRÍTICO: Inconsistencia que bloquea el trámite
- OBSERVACIÓN: Requiere aclaración pero no bloquea
- CONFORME: Sin inconsistencias detectadas

Resultado:
{
    "cruces_evaluados": [
        {
            "cruce": "B-04 ↔ B-02",
            "descripcion": "...",
            "resultado": "CRÍTICO|OBSERVACIÓN|CONFORME",
            "detalle": "..."
        }
    ],
    "resumen": {
        "criticos": 0,
        "observaciones": 0,
        "conformes": 0
    },
    "estado_expediente": "CONFORME|CON_OBSERVACIONES|RECHAZADO"
}
`;

// ============================================================================
// CAPA 5 - FORMATO DE SALIDA ESTRUCTURADO
// ============================================================================
export const OUTPUT_FORMAT_PROMPT = `
=== FORMATO DE RESPUESTA OBLIGATORIO ===

Devuelve SIEMPRE un JSON válido con esta estructura:

{
    "etapa": {
        "codigo": "B-02",
        "nombre": "Certificados de Análisis de Materias Primas",
        "tipo": "MULTI|SINGLE",
        "modulo": "Calidad"
    },
    
    "archivos_analizados": [
        {
            "nombre": "archivo.pdf",
            "tipo_documento": "CoA API|CoA colorante|...",
            "datos_extraidos": {
                "api_asociado": "...",
                "lote": "...",
                "fabricante": "...",
                "fecha_emision": "...",
                "fecha_vencimiento": "..."
            }
        }
    ],
    
    "clasificacion": {
        "por_api": { "API_1": [...archivos], "API_2": [...archivos] },
        "por_lote": { "LOTE_1": [...archivos] },
        "por_presentacion": { "100ml": [...archivos] }
    },
    
    "validaciones": {
        "conformes": [
            { "item": "...", "detalle": "..." }
        ],
        "observaciones": [
            { "item": "...", "detalle": "...", "severidad": "MEDIA" }
        ],
        "errores_criticos": [
            { "item": "...", "detalle": "...", "bloquea_tramite": true }
        ]
    },
    
    "datos_para_cruce": {
        "apis_detectados": ["..."],
        "lotes_detectados": ["..."],
        "fabricantes_detectados": ["..."]
    },
    
    "estado_etapa": "COMPLETA|INCOMPLETA|OBSERVADA",
    
    "conclusion": "Resumen ejecutivo de la evaluación"
}
`;

// ============================================================================
// FUNCIÓN PRINCIPAL: CONSTRUIR PROMPT COMPLETO
// ============================================================================
export interface PromptBuildOptions {
    stageCode: string;
    stageName: string;
    stageDescription: string;
    module: string;
    isMultiFile: boolean;
    customPrompt?: string | null;
    documentContent: string;
    fileNames?: string[];
    formulaData?: any; // Datos de B-04 para validación cruzada
    crossReferenceData?: any; // Datos de otras etapas
}

export function buildCompletePrompt(options: PromptBuildOptions): {
    systemPrompt: string;
    userPrompt: string;
} {
    const {
        stageCode,
        stageName,
        stageDescription,
        module,
        isMultiFile,
        customPrompt,
        documentContent,
        fileNames = [],
        formulaData,
        crossReferenceData
    } = options;

    // System Prompt (Capa 0)
    const systemPrompt = SYSTEM_PROMPT_ARCSA;

    // Construir User Prompt con todas las capas
    let userPrompt = '';

    // Capa 1: Contexto de Etapa
    userPrompt += buildStageContextPrompt({
        code: stageCode,
        name: stageName,
        description: stageDescription,
        module: module,
        isMultiFile: isMultiFile
    });

    // Capa 2: Clasificación de Archivos
    userPrompt += '\n\n' + FILE_CLASSIFICATION_PROMPT;

    // Capa 3: Prompt Específico de Etapa (priorizar customPrompt si existe)
    if (customPrompt && customPrompt.trim().length > 0) {
        userPrompt += '\n\n=== INSTRUCCIONES ESPECÍFICAS CONFIGURADAS ===\n' + customPrompt;
    } else if (STAGE_SPECIFIC_PROMPTS[stageCode]) {
        userPrompt += '\n\n' + STAGE_SPECIFIC_PROMPTS[stageCode];
    }

    // Datos de contexto cruzado si están disponibles
    if (formulaData) {
        userPrompt += `\n\n=== DATOS DE FÓRMULA (B-04) PARA VALIDACIÓN CRUZADA ===
${JSON.stringify(formulaData, null, 2)}`;
    }

    if (crossReferenceData) {
        userPrompt += `\n\n=== DATOS DE OTRAS ETAPAS PARA VALIDACIÓN CRUZADA ===
${JSON.stringify(crossReferenceData, null, 2)}`;
    }

    // Capa 5: Formato de Salida
    userPrompt += '\n\n' + OUTPUT_FORMAT_PROMPT;

    // Documento(s) a analizar
    userPrompt += `\n\n=== DOCUMENTO(S) A ANALIZAR ===
${fileNames.length > 0 ? `Archivos: ${fileNames.join(', ')}` : ''}

CONTENIDO EXTRAÍDO:
"""
${documentContent}
"""`;

    return {
        systemPrompt,
        userPrompt
    };
}

// ============================================================================
// ITEMS QUE PERMITEN MÚLTIPLES ARCHIVOS
// ============================================================================
export const MULTI_FILE_STAGES = ['B-02', 'B-07', 'B-08', 'B-09', 'C-01', 'C-03', 'C-05', 'A-01'];

export function isMultiFileStage(stageCode: string): boolean {
    return MULTI_FILE_STAGES.includes(stageCode);
}

// ============================================================================
// TIPO DE RESULTADO DE ANÁLISIS
// ============================================================================
export interface AIAnalysisResult {
    etapa: {
        codigo: string;
        nombre: string;
        tipo: 'MULTI' | 'SINGLE';
        modulo: string;
    };
    archivos_analizados: Array<{
        nombre: string;
        tipo_documento: string;
        datos_extraidos: {
            api_asociado?: string;
            lote?: string;
            fabricante?: string;
            fecha_emision?: string;
            fecha_vencimiento?: string;
            [key: string]: any;
        };
    }>;
    clasificacion: {
        por_api?: Record<string, string[]>;
        por_lote?: Record<string, string[]>;
        por_presentacion?: Record<string, string[]>;
    };
    validaciones: {
        conformes: Array<{ item: string; detalle: string }>;
        observaciones: Array<{ item: string; detalle: string; severidad: string }>;
        errores_criticos: Array<{ item: string; detalle: string; bloquea_tramite: boolean }>;
    };
    datos_para_cruce: {
        apis_detectados: string[];
        lotes_detectados: string[];
        fabricantes_detectados: string[];
    };
    estado_etapa: 'COMPLETA' | 'INCOMPLETA' | 'OBSERVADA';
    conclusion: string;
    
    // Campos legacy para compatibilidad
    idioma?: string;
    fecha_emision?: string;
    fecha_vencimiento?: string;
    tipo_detectado?: string;
    coincide_con_requisito?: boolean;
    alertas?: Array<{ type: string; message: string }>;
}
