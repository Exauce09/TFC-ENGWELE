# Build production — Centre Medical AMEN
Write-Host "Build frontend production..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot\frontend"

if (-not (Test-Path "node_modules")) {
    npm install
}

if (-not (Test-Path ".env.production")) {
    if (Test-Path ".env.production.example") {
        Copy-Item ".env.production.example" ".env.production"
        Write-Host "Fichier .env.production cree depuis l'exemple. Adaptez VITE_API_URL." -ForegroundColor Yellow
    }
}

npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build OK -> frontend/dist/" -ForegroundColor Green
    Write-Host "Deployez le contenu de frontend/dist/ sur votre serveur web." -ForegroundColor Green
} else {
    Write-Host "Echec du build." -ForegroundColor Red
    exit 1
}
