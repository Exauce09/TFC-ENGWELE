# Build APK Android — Centre Medical AMEN
# Genere une APK installable directement (sans Expo Go)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\mobile

if (-not (Test-Path .env.production)) {
    Copy-Item .env.production.example .env.production
    Write-Host "Fichier .env.production cree. Adaptez EXPO_PUBLIC_API_URL." -ForegroundColor Yellow
}

# Charger EXPO_PUBLIC_API_URL pour le build cloud
Get-Content .env.production | ForEach-Object {
    if ($_ -match '^\s*EXPO_PUBLIC_API_URL=(.+)$') {
        $env:EXPO_PUBLIC_API_URL = $matches[1].Trim()
    }
}

if (-not $env:EXPO_PUBLIC_API_URL) {
    Write-Host "ERREUR: EXPO_PUBLIC_API_URL manquant dans mobile/.env.production" -ForegroundColor Red
    exit 1
}

Write-Host "Build APK Android (EAS Cloud)..." -ForegroundColor Cyan
Write-Host "API: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "Premiere fois ? Executez: npx eas-cli login" -ForegroundColor Yellow
Write-Host ""

npx eas-cli build -p android --profile preview

Write-Host ""
Write-Host "Quand le build termine, telechargez l'APK depuis le lien Expo et installez sur le telephone." -ForegroundColor Green
Write-Host "Guide complet: docs/MOBILE_INSTALL.md" -ForegroundColor Gray
