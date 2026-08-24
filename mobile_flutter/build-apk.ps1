# Build APK Android — Flutter AMEN
# Usage:
#   .\build-apk.ps1
#   .\build-apk.ps1 -ApiBaseUrl "https://xxx.trycloudflare.com/api/v1"
# Si -ApiBaseUrl omis : lit ..\.api-public-url (écrit par start-api-online.ps1)
param(
    [string]$ApiBaseUrl = ""
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$flutter = $null
if (Get-Command flutter -ErrorAction SilentlyContinue) {
    $flutter = "flutter"
} elseif (Test-Path "C:\flutter\bin\flutter.bat") {
    $flutter = "C:\flutter\bin\flutter.bat"
    $env:PATH = "C:\flutter\bin;$env:PATH"
} else {
    Write-Host "Flutter introuvable. Installez le SDK (voir docs/MOBILE_FLUTTER.md)." -ForegroundColor Red
    exit 1
}

$urlFile = Join-Path (Split-Path $PSScriptRoot -Parent) ".api-public-url"
if (-not $ApiBaseUrl -and (Test-Path $urlFile)) {
    $ApiBaseUrl = (Get-Content $urlFile -Raw).Trim()
}

$defineArgs = @()
if ($ApiBaseUrl) {
    Write-Host "API_BASE_URL=$ApiBaseUrl" -ForegroundColor Cyan
    $defineArgs += "--dart-define=API_BASE_URL=$ApiBaseUrl"
} else {
    Write-Host "Pas d'URL publique : fallback lib/config/api_config.dart" -ForegroundColor Yellow
}

$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot"
$env:PATH = "C:\flutter\bin;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "flutter pub get..." -ForegroundColor Cyan
& $flutter pub get
Write-Host "flutter build apk --release..." -ForegroundColor Cyan
& $flutter build apk --release @defineArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$apk = Join-Path $PSScriptRoot "build\app\outputs\flutter-apk\app-release.apk"
$destDir = Join-Path (Split-Path $PSScriptRoot -Parent) "releases"
New-Item -ItemType Directory -Force -Path $destDir | Out-Null
Copy-Item $apk (Join-Path $destDir "AMEN-flutter-v1.0.0.apk") -Force
Write-Host ""
Write-Host "APK: $apk" -ForegroundColor Green
Write-Host "Copie: $destDir\AMEN-flutter-v1.0.0.apk" -ForegroundColor Green
