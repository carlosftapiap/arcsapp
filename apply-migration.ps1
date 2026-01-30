
# Script para aplicar migración SQL manualmente usando Prisma
write-host "Applying migration..."

# Cargar variables de entorno desde .env manualmente
$content = Get-Content .env
$directUrlLine = $content | Where-Object { $_ -match "^DIRECT_URL=" }
if ($directUrlLine) {
    $directUrl = $directUrlLine -replace "^DIRECT_URL=", "" -replace '"', ""
    # Usamos DIRECT_URL para operaciones de esquema (DDL)
    $env:DATABASE_URL = $directUrl
    write-host "Using connection: $directUrl"
}
else {
    write-host "WARNING: DIRECT_URL not found in .env"
}

write-host "Generating Prisma Client..."
cmd /c "npx prisma generate"

node apply_migration.js
if ($LASTEXITCODE -eq 0) {
    write-host "Migration applied successfully!"
}
else {
    write-host "Migration failed."
}
# pause removed for automation
