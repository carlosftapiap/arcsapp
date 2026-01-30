
# Script para verificar usuarios
write-host "Checking users..."

# Cargar variables de entorno desde .env manualmente
$content = Get-Content .env
$directUrlLine = $content | Where-Object { $_ -match "^DIRECT_URL=" }
if ($directUrlLine) {
    $directUrl = $directUrlLine -replace "^DIRECT_URL=", "" -replace '"', ""
    $env:DATABASE_URL = $directUrl
    write-host "Using connection: $directUrl"
}

node check_users.js
pause
