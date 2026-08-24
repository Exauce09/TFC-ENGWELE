# Expose l'API Laravel en HTTPS public via Cloudflare Tunnel (téléphone / hors LAN).
# Prérequis : backend sur le port 8000 (start-backend.ps1) + cloudflared installé.
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$urlFile = Join-Path $root ".api-public-url"

$cloudflared = @(
    "C:\Program Files (x86)\cloudflared\cloudflared.exe",
    "C:\Program Files\cloudflared\cloudflared.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $cloudflared) {
    Write-Host "Installation de cloudflared..." -ForegroundColor Yellow
    winget install -e --id Cloudflare.cloudflared --accept-package-agreements --accept-source-agreements --disable-interactivity
    $cloudflared = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe"
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
}

if (-not $cloudflared) {
    Write-Host "cloudflared introuvable." -ForegroundColor Red
    exit 1
}

$portOk = $false
try {
    $null = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/v1/departements" -UseBasicParsing -TimeoutSec 5
    $portOk = $true
} catch { }

if (-not $portOk) {
    Write-Host "Backend absent sur :8000 — demarrage..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$root\start-backend.ps1`"" -WindowStyle Minimized
    Start-Sleep -Seconds 4
}

Write-Host "Tunnel Cloudflare vers http://127.0.0.1:8000 ..." -ForegroundColor Cyan
Write-Host "Laissez cette fenetre ouverte. L'URL change a chaque redemarrage." -ForegroundColor DarkGray

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $cloudflared
$psi.Arguments = "tunnel --url http://127.0.0.1:8000"
$psi.RedirectStandardError = $true
$psi.RedirectStandardOutput = $true
$psi.UseShellExecute = $false
$psi.CreateNoWindow = $false
$p = [System.Diagnostics.Process]::Start($psi)

$publicBase = $null
$deadline = (Get-Date).AddMinutes(2)
while ((Get-Date) -lt $deadline -and -not $p.HasExited) {
    $line = $p.StandardError.ReadLine()
    if ($null -eq $line) { Start-Sleep -Milliseconds 200; continue }
    Write-Host $line
    if ($line -match 'https://[a-zA-Z0-9-]+\.trycloudflare\.com') {
        $publicBase = $Matches[0].TrimEnd('/')
        break
    }
}

if (-not $publicBase) {
    Write-Host "URL publique non detectee." -ForegroundColor Red
    exit 1
}

$api = "$publicBase/api/v1"
Set-Content -Path $urlFile -Value $api -Encoding UTF8
Write-Host ""
Write-Host "API publique : $api" -ForegroundColor Green
Write-Host "Fichier      : $urlFile" -ForegroundColor Green
Write-Host ""
Write-Host "Rebuild APK :" -ForegroundColor Cyan
Write-Host "  cd mobile_flutter; .\build-apk.ps1" -ForegroundColor White
Write-Host ""

# Continuer a afficher les logs
while (-not $p.HasExited) {
    $line = $p.StandardError.ReadLine()
    if ($null -ne $line) { Write-Host $line }
}
exit $p.ExitCode
