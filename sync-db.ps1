write-host "Sincronizando base de datos con Prisma..."
# Usar DIRECT_URL explícitamente para db pull para evitar colgarse con el pooler
# Asumimos que .env tiene DIRECT_URL definido correctamente
$env:DATABASE_URL = $env:DIRECT_URL 
# Si no carga env var aqui, forzamos lectura desde .env (o asumimos que dotenv lo carga al ejecutar prisma si está configurado)
# Mejor enfoque: pasar la URL como variable de entorno al proceso npx (en powershell es diferente)

# Forma robusta: Leer directo del archivo .env si es necesario, pero intentemos con el archivo config ya fixeado.
# Como prisma.config.ts lee process.env.DATABASE_URL, si cambiamos la variable de entorno ANTES de ejecutar, debería funcionar.

# Pero espera, si corremos npx prisma, este inicia un nuevo proceso. 
# En PowerShell podemos setear la variable para la sesion actual:

# Recuperar valor de DIRECT_URL del archivo .env (simple regex)
$content = Get-Content .env
$directUrlLine = $content | Where-Object { $_ -match "^DIRECT_URL=" }
if ($directUrlLine) {
    $directUrl = $directUrlLine -replace "^DIRECT_URL=", "" -replace '"', ""
    write-host "Usando conexión directa para introspección: $directUrl"
    $env:DATABASE_URL = $directUrl
}
else {
    write-host "ADVERTENCIA: No se encontró DIRECT_URL en .env. Se intentará con DATABASE_URL por defecto."
}

npx prisma db pull
npx prisma generate
write-host "¡Listo! Cliente de Prisma generado."
pause
