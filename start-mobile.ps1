Set-Location $PSScriptRoot\mobile
if (-not (Test-Path .env)) {
  Copy-Item .env.example .env
  Write-Host "Fichier .env cree depuis .env.example" -ForegroundColor Yellow
}
Write-Host "Demarrage app mobile AMEN (Expo)" -ForegroundColor Cyan
Write-Host "API: voir mobile/.env (EXPO_PUBLIC_API_URL)" -ForegroundColor Gray
Write-Host "Backend requis: .\start-backend.ps1" -ForegroundColor Gray
npx expo start
