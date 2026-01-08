# ARCSAPP - Arquitectura y Estructura de la Aplicación

## Resumen General

**ARCSAPP** es una aplicación de gestión regulatoria para el control documental y cumplimiento de trámites de Registro Sanitario de medicamentos ante **ARCSA** (Agencia Nacional de Regulación, Control y Vigilancia Sanitaria - Ecuador).

### Stack Tecnológico
- **Framework**: Next.js 15.5.9 (App Router)
- **Base de datos**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: React + TailwindCSS + Lucide Icons
- **Internacionalización**: next-intl (ES, EN, HI, ZH)
- **IA**: OpenAI GPT-4o-mini (Responses API con input_file para PDFs)

---

## Estructura de Directorios

```
ARCSAPP/
├── app/
│   └── [locale]/                    # Rutas internacionalizadas
│       ├── app/                     # Área principal de la aplicación
│       │   ├── dossiers/            # Gestión de dossiers
│       │   │   ├── [id]/            # Detalle de dossier específico
│       │   │   │   ├── page.tsx     # Server Component - fetch datos
│       │   │   │   └── DossierDetailClient.tsx  # Client Component - UI interactiva
│       │   │   └── actions/         # Server Actions
│       │   │       ├── ai-analysis.ts        # Análisis IA (single + multi-file)
│       │   │       ├── ai-analysis-item.ts   # Análisis por item (legacy)
│       │   │       ├── ai-analysis-v2.ts     # Versión alternativa
│       │   │       ├── document-actions.ts   # Upload/delete documentos
│       │   │       └── review-actions.ts     # Revisiones técnicas
│       │   └── products/            # Gestión de productos
│       └── admin/                   # Panel de administración
│           └── configuracion/       # Configuración del sistema
│               ├── laboratorios/    # CRUD laboratorios
│               ├── usuarios/        # CRUD usuarios
│               └── templates/       # Plantillas de checklist
├── components/                      # Componentes reutilizables
│   ├── layout/                      # Header, Sidebar, etc.
│   └── ui/                          # Botones, modales, etc.
├── lib/
│   ├── supabase/                    # Cliente Supabase
│   │   ├── client.ts                # Cliente browser
│   │   └── server.ts                # Cliente server
│   └── ai/
│       └── prompts-arcsa.ts         # Sistema de prompts por capas ARCSA
├── messages/                        # Traducciones
│   ├── es.json                      # Español
│   ├── en.json                      # Inglés
│   ├── hi.json                      # Hindi
│   └── zh.json                      # Chino
└── supabase/
    └── migrations/                  # Migraciones SQL
```

---

## Modelo de Datos (Supabase)

### Tablas Principales

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│      labs       │     │    products     │     │    dossiers     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID)       │◄────│ lab_id (FK)     │     │ id (UUID)       │
│ name            │     │ nombre_comercial│◄────│ product_id (FK) │
│ ruc             │     │ principio_activo│     │ lab_id (FK)     │
│ openai_api_key  │     │ forma_farmaceut │     │ product_name    │
│ status          │     │ ...             │     │ product_type    │
└─────────────────┘     └─────────────────┘     │ status          │
                                                 └────────┬────────┘
                                                          │
                        ┌─────────────────────────────────┘
                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ checklist_items │     │  dossier_items  │     │   documents     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (UUID)       │◄────│ checklist_item_id│◄───│ dossier_item_id │
│ code (A-01, etc)│     │ dossier_id (FK) │     │ id (UUID)       │
│ module          │     │ status          │     │ file_path       │
│ title_i18n_json │     │ id (UUID)       │     │ version         │
│ required        │     └─────────────────┘     │ status          │
│ critical        │                             │ uploaded_at     │
│ allows_multiple │                             └────────┬────────┘
│ ai_prompt       │                                      │
└─────────────────┘                             ┌────────┴────────┐
                                                ▼                 ▼
                              ┌─────────────────────┐  ┌─────────────────────┐
                              │ai_document_analyses │  │ technical_reviews   │
                              ├─────────────────────┤  ├─────────────────────┤
                              │ document_id (FK)    │  │ document_id (FK)    │
                              │ analysis_json       │  │ decision (approved/ │
                              │ status              │  │   observed)         │
                              │ alerts              │  │ comments            │
                              │ created_at          │  │ comments_i18n       │
                              └─────────────────────┘  │ reviewer_id         │
                                                       └─────────────────────┘
```

### Roles de Usuario
- `super_admin`: Acceso total, puede ejecutar análisis IA
- `lab_admin`: Administrador de laboratorio
- `lab_uploader`: Solo puede subir documentos
- `lab_viewer`: Solo lectura
- `reviewer`: Revisor externo (técnico/químico)

---

## Flujo de Dossier

```
1. CREAR DOSSIER
   └── Se asocia a un producto y laboratorio
   └── Se crean dossier_items según template del product_type

2. SUBIR DOCUMENTOS
   └── Usuario sube PDF/DOCX a cada dossier_item
   └── Se guarda en Supabase Storage (bucket: dossier-documents)
   └── Se crea registro en tabla documents

3. ANÁLISIS IA (Administrador)
   └── Super Admin ejecuta análisis IA
   └── Si etapa es MULTI-FILE: analiza TODOS los documentos del item
   └── Usa OpenAI Responses API con input_file (soporta PDFs escaneados)
   └── Resultado se guarda en ai_document_analyses

4. REVISIÓN TÉCNICA
   └── Revisor aprueba u observa cada documento
   └── Comentarios se traducen automáticamente a 4 idiomas
   └── Se guarda en technical_reviews

5. ESTADO FINAL
   └── Cuando todos los items requeridos están aprobados → Dossier READY
```

---

## Sistema de Análisis IA

### Archivo Principal: `ai-analysis.ts`

```typescript
export async function runAIAnalysis(documentId: string) {
    // 1. Obtener documento y metadatos de la etapa
    // 2. Detectar si es etapa MULTI-FILE (A-02, B-02, C-01, etc.)
    // 3. Si MULTI: traer TODOS los documentos del dossier_item
    // 4. Convertir PDFs a base64 y enviar como input_file
    // 5. Usar OpenAI Responses API (soporta PDFs escaneados)
    // 6. Guardar resultado en ai_document_analyses
}
```

### Etapas Multi-Archivo
Definidas en `lib/ai/prompts-arcsa.ts`:
```typescript
const MULTI_FILE_STAGES = ['A-02', 'B-01', 'B-02', 'B-07', 'B-08', 'B-09', 'C-01', 'C-03', 'C-05'];
```

### Arquitectura de Prompts (3 capas)
1. **SYSTEM_PROMPT_ARCSA**: Contexto general de analista regulatorio
2. **STAGE_SPECIFIC_PROMPTS**: Prompts específicos por código de etapa (A-01, A-02, etc.)
3. **customPrompt**: Prompt personalizado en `checklist_items.ai_prompt`

---

## Componente Principal: DossierDetailClient.tsx

### Estructura Visual

```
┌────────────────────────────────────────────────────────────┐
│  HEADER: Producto + Tipo + Origen + Progreso               │
├────────────────────────────────────────────────────────────┤
│  MÓDULO: Legal (azul) ⚖️                                   │
│  ├── A-01: Certificado BPM/GMP                             │
│  │   └── BLOQUE A (Archivo) | BLOQUE B (Estado) |          │
│  │       BLOQUE C (Análisis Admin) | BLOQUE D (Dictamen)   │
│  ├── A-02: CPP/CLV  [MULTI-ARCHIVO]                        │
│  └── ...                                                    │
├────────────────────────────────────────────────────────────┤
│  MÓDULO: Quality (púrpura) 🔬                              │
│  ├── B-01: Desarrollo y Fabricación                        │
│  ├── B-02: CoA Materias Primas [MULTI-ARCHIVO]             │
│  └── ...                                                    │
├────────────────────────────────────────────────────────────┤
│  MÓDULO: Efficacy (verde) 💊                               │
│  └── C-01: Estudios de Estabilidad [MULTI-ARCHIVO]         │
└────────────────────────────────────────────────────────────┘
```

### Estados Importantes
```typescript
const [items, setItems] = useState<DossierItem[]>(initialItems);
const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
const [jsonModalData, setJsonModalData] = useState<any | null>(null);
```

### Helpers
- `getModuleColors(moduleName)`: Retorna colores específicos por módulo
- `formatAnalysisToText(data, t)`: Convierte JSON de análisis a texto legible traducido

---

## Internacionalización

### Archivos de Traducción
- `messages/es.json` - Español (principal)
- `messages/en.json` - Inglés
- `messages/hi.json` - Hindi (para fabricantes de India)
- `messages/zh.json` - Chino

### Uso en Componentes
```typescript
const t = useTranslations();
const locale = useLocale();

// Ejemplo
t('ai.detailTitle')  // "Detalle del Análisis" (es) / "Analysis Details" (en)
```

---

## Supabase Storage

### Bucket: `dossier-documents`
- **Estructura de path**: `{lab_id}/{dossier_id}/{filename}`
- **Versionamiento**: `v{version}_{timestamp}_{originalName}`
- **Tipos permitidos**: PDF, DOCX, DOC
- **Tamaño máximo**: 10MB por archivo

---

## Configuración Next.js

### `next.config.mjs`
```javascript
const nextConfig = {
    experimental: {
        allowedDevOrigins: [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            // ... otros orígenes de desarrollo
        ],
    },
    // ...
};
```

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Ejecutar migraciones Supabase
npx supabase db push

# Ver logs de Supabase
npx supabase logs
```

---

## Notas para Futuras Modificaciones

1. **Agregar nueva etapa al checklist**: 
   - Insertar en `checklist_items` con código único
   - Si es multi-archivo, agregar a `MULTI_FILE_STAGES` en `prompts-arcsa.ts`
   - Agregar traducciones en `stageInstructions` de cada idioma

2. **Modificar análisis IA**:
   - Archivo principal: `app/[locale]/app/dossiers/actions/ai-analysis.ts`
   - Prompts: `lib/ai/prompts-arcsa.ts`
   - Modelo usado: `gpt-4o-mini` con Responses API

3. **Agregar nuevo módulo/color**:
   - Actualizar `getModuleColors()` en `DossierDetailClient.tsx`
   - Agregar traducciones en `dossiers.modules`

4. **Nuevas traducciones**:
   - Agregar keys en `messages/es.json` y `messages/en.json`
   - Otros idiomas opcionales

---

*Última actualización: Enero 2026*
