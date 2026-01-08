# ARCSAPP - Sistema de Gestión de Dossiers Regulatorios

ARCSAPP es una plataforma SaaS multi-tenant para la gestión de expedientes regulatorios (Registro Sanitario) con workflow documental, checklist editable, revisión externa y análisis de documentos con IA.

## 🚀 Características Principales

- **Multi-Tenant (Multi-Empresa)**: Gestión de múltiples laboratorios con aislamiento total de datos
- **RBAC Completo**: 5 roles (Super Admin, Lab Admin, Lab Uploader, Lab Viewer, Reviewer)
- **Workflow Documental**: Checklist por tipo de producto con seguimiento de estados
- **Revisión Externa**: Técnicos/químicos farmacéuticos pueden revisar dossiers asignados
- **IA Dual**: Análisis de documentos con OpenAI GPT-4 y Google Gemini (seleccionable)
- **i18n**: Soporte completo para 4 idiomas (Español, Inglés, Hindi, Chino)
- **Versionado de Documentos**: Control de versiones automático al reemplazar PDFs
- **Notificaciones**: Emails automáticos por eventos críticos
- **Seguridad**: RLS (Row Level Security) en todas las tablas y Storage

## 📋 Requisitos Previos

- Node.js 18+ y npm
- Cuenta de Supabase (gratuita disponible en [supabase.com](https://supabase.com))
- Claves API (opcionales para funciones completas):
  - OpenAI API Key
  - Google AI API Key (Gemini)
  - Resend API Key (para emails)

## 🛠️ Instalación

### 1. Clonar el Proyecto

```bash
cd "d:/App/App Creadas por IA/ARCSAPP"
npm install
```

### 2. Configurar Variables de Entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
# Supabase (YA CONFIGURADO)
NEXT_PUBLIC_SUPABASE_URL=https://untqjhyldlbvviwhmisn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_0G0TSCBYzgUAEBe1FpiN8g_vNyxft4L

# Obtener Service Role Key:
# 1. Ir a Supabase Dashboard → Settings → API
# 2. Copiar "service_role" secret key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui

# Claves de IA (opcionales)
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...

# Email (opcional)
RESEND_API_KEY=re_...
```

### 3. Configurar Base de Datos en Supabase

#### Opción A: Usando Supabase CLI (Recomendado)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Inicializar
supabase init

# Conectar a tu proyecto
supabase link --project-ref untqjhyldlbvviwhmisn

# Ejecutar migraciones
supabase db push

# Ejecutar seed
supabase db seed
```

#### Opción B: Manual desde Dashboard

1. Ir a tu proyecto Supabase → SQL Editor
2. Ejecutar en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_storage_policies.sql`
3. Ejecutar `supabase/seed.sql`

### 4. Crear Usuario Super Admin

1. Ir a Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Email: `admin@arcsapp.com`
4. Password: `Admin123!` (cambiar después)
5. Copiar el UUID del usuario creado
6. Ir a SQL Editor y ejecutar:

```sql
INSERT INTO profiles (user_id, full_name, email, locale)
VALUES ('UUID-COPIADO-AQUI', 'Super Administrador', 'admin@arcsapp.com', 'es');

INSERT INTO lab_members (lab_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'UUID-COPIADO-AQUI', 'super_admin');
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 🗂️ Estructura del Proyecto

```
ARCSAPP/
├── app/                          # Next.js App Router
│   └── [locale]/                 # Rutas i18n
│       ├── login/                # Autenticación
│       ├── admin/                # Panel Super Admin
│       │   └── configuracion/    # Gestión Labs/Usuarios/Plantillas
│       ├── app/                  # Panel Laboratorio
│       │   └── dossiers/         # Gestión de Dossiers
│       └── revision/             # Panel Revisor Externo
├── components/                   # Componentes React
│   ├── admin/                    # Componentes de administración
│   ├── dossiers/                 # Componentes de dossiers
│   ├── checklist/                # Componentes de checklist
│   ├── revision/                 # Componentes de revisión
│   └── ia/                       # Componentes de IA
├── lib/
│   ├── supabase/                 # Clientes y utilidades Supabase
│   └── ia/                       # Proveedores de IA
├── messages/                     # Archivos de traducción i18n
│   ├── es.json                   # Español
│   ├── en.json                   # English
│   ├── hi.json                   # हिंदी
│   └── zh-CN.json                # 中文
└── supabase/
    ├── migrations/               # Migraciones SQL
    ├── functions/                # Edge Functions
    └── seed.sql                  # Datos de prueba
```

## 🔐 Roles y Permisos

| Rol | Acceso |
|-----|--------|
| **super_admin** | Gestión completa del sistema, todos los laboratorios |
| **lab_admin** | Gestión de su laboratorio, usuarios y dossiers |
| **lab_uploader** | Subir/eliminar documentos, responder observaciones |
| **lab_viewer** | Solo lectura de dossiers de su laboratorio |
| **reviewer** | Revisar documentos de laboratorios asignados |

## 📊 Tipos de Producto

- `medicine_general`: Medicamentos Generales
- `biologic`: Productos Biológicos
- `device_medical`: Dispositivos Médicos

Cada tipo tiene su propia plantilla de checklist con ítems específicos.

## 🤖 Análisis con IA

El sistema permite analizar documentos PDF usando:
- **OpenAI GPT-4o**: Mayor precisión en documentos complejos
- **Google Gemini 1.5 Pro**: Procesamiento rápido y económico

### Hallazgos de la IA:
- Fechas de emisión/caducidad
- Alertas de vencimiento (≤90 días)
- Idioma del documento
- Entidades (fabricante, autoridad emisora, certificado#)
- Validación de nombre de producto
- Nivel de riesgo (low/medium/high)

## 📧 Notificaciones por Email

Eventos que disparan emails automáticos:
- `DOC_UPLOADED`: Documento subido → Notifica a revisor
- `DOC_DELETED`: Documento eliminado → Notifica a revisor
- `ITEM_OBSERVED`: Ítem observado → Notifica a uploader
- `ITEM_APPROVED`: Ítem aprobado → Notifica a lab_admin
- `DOSSIER_STATUS_CHANGED`: Cambio de estado → Todos los miembros del lab

## 🌍 Cambiar Idioma

Los usuarios pueden cambiar su idioma preferido desde su perfil. Los idiomas soportados son:
- 🇪🇸 Español (es)
- 🇬🇧 English (en)
- 🇮🇳 हिंदी (hi)
- 🇨🇳 中文 (zh-CN)

## 🚀 Despliegue en Producción

### Vercel (Recomendado para Next.js)

1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Deploy automático

### Variables de Entorno en Producción

Asegurarse de configurar todas las variables en el panel de Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `GOOGLE_AI_API_KEY`
- `RESEND_API_KEY`

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start

# Lint
npm run lint

# Type check
npm run type-check
```

## 📝 Próximos Pasos

1. **Ejecutar migraciones** en Supabase
2. **Crear super admin** en Auth
3. **Actualizar seed.sql** con UUIDs reales
4. **Configurar claves API** de OpenAI/Gemini/Resend
5. **Desarrollar componentes UI** siguiendo el plan de implementación
6. **Testing de RLS** para verificar aislamiento multi-tenant

## 📚 Documentación Adicional

- [Plan de Implementación](./implementation_plan.md) - Arquitectura detallada
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [next-intl Docs](https://next-intl-docs.vercel.app/)

## 🆘 Soporte

Para preguntas o problemas técnicos, consultar:
- Plan de implementación para detalles de arquitectura
- Esquema SQL para estructura de base de datos
- Políticas RLS para reglas de seguridad

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

**Desarrollado con** ❤️ **usando Next.js, Supabase, TypeScript y IA**
