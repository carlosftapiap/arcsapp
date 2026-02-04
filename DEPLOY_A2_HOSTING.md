# Despliegue en A2 Hosting - ARCSAPP

## Estructura generada

La carpeta `dist/` contiene todo lo necesario para desplegar en A2 Hosting con Node.js:

```
dist/
├── .env                 # Variables de entorno (configurar con valores de producción)
├── .env.example         # Ejemplo de variables requeridas
├── .next/               # Build de Next.js
├── node_modules/        # Dependencias mínimas (standalone)
├── public/              # Archivos estáticos (logo, favicon)
├── package.json         # Configuración del proyecto
└── server.js            # Servidor de producción
```

## Pasos para desplegar en A2 Hosting

### 1. Preparar variables de entorno

Editar el archivo `.env` en la carpeta `dist/` con los valores de producción:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/database
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
OPENAI_API_KEY=tu-openai-key
NODE_ENV=production
PORT=3000
```

### 2. Subir archivos a A2 Hosting

Subir el contenido de la carpeta `dist/` a:
```
public_html/arcsa.evophar.com/
```

La estructura final en el servidor debe ser:
```
public_html/arcsa.evophar.com/
├── .env
├── .next/
├── node_modules/
├── public/
├── package.json
└── server.js
```

### 3. Configurar Node.js en A2 Hosting

En el panel de control de A2 Hosting:

1. Ir a **Setup Node.js App**
2. Crear nueva aplicación:
   - **Node.js version**: 18.x o superior
   - **Application mode**: Production
   - **Application root**: `arcsa.evophar.com`
   - **Application URL**: `arcsa.evophar.com`
   - **Application startup file**: `server.js`

3. Configurar variables de entorno en el panel (o usar el archivo .env)

4. Hacer clic en **Run NPM Install** (opcional, ya están incluidas las dependencias mínimas)

5. Hacer clic en **Start App**

### 4. Configurar dominio/subdominio

Asegurarse de que el subdominio `arcsa.evophar.com` apunte al directorio correcto.

## Comandos útiles (SSH)

```bash
# Navegar al directorio
cd ~/public_html/arcsa.evophar.com

# Iniciar la aplicación
node server.js

# O con PM2 (si está disponible)
pm2 start server.js --name arcsapp
pm2 save
```

## Verificación

Una vez desplegado, acceder a:
- https://arcsa.evophar.com
- https://www.arcsa.evophar.com

## Notas importantes

1. **Node.js requerido**: Versión 18.x o superior
2. **Puerto**: La app escucha en el puerto definido en `PORT` (default: 3000). A2 Hosting maneja el proxy automáticamente.
3. **SSL**: Configurar certificado SSL en el panel de A2 Hosting para HTTPS
4. **Variables de entorno**: Nunca subir el archivo `.env` con credenciales al repositorio
