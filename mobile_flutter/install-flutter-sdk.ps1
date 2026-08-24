# Installe / configure Flutter SDK depuis le zip telecharge
$ErrorActionPreference = "Stop"
$zip = "$env:TEMP\flutter_windows.zip"
$dest = "C:\flutter"

if (-not (Test-Path $zip)) {
    Write-Host "Zip manquant: $zip" -ForegroundColor Red
    Write-Host "Telechargez: https://docs.flutter.dev/get-started/install/windows"
    exit 1
}

$sizeMb = [math]::Round((Get-Item $zip).Length / 1MB, 1)
if ($sizeMb -lt 800) {
    Write-Host "Zip trop petit ($sizeMb MB) — telechargement incomplet." -ForegroundColor Red
    exit 1
}

Write-Host "Extraction vers $dest ($sizeMb MB)..." -ForegroundColor Cyan
if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
Expand-Archive -Path $zip -DestinationPath "C:\" -Force

$flutterBat = Join-Path $dest "bin\flutter.bat"
if (-not (Test-Path $flutterBat)) {
    Write-Host "flutter.bat introuvable apres extraction" -ForegroundColor Red
    exit 1
}

$env:PATH = "$dest\bin;$env:PATH"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$dest\bin*") {
    [Environment]::SetEnvironmentVariable("Path", "$dest\bin;$userPath", "User")
    Write-Host "PATH utilisateur mis a jour (+ C:\flutter\bin)" -ForegroundColor Green
}

Write-Host "flutter --version" -ForegroundColor Cyan
& $flutterBat --version
Write-Host "flutter doctor -v" -ForegroundColor Cyan
& $flutterBat doctor -v
Write-Host "OK. Relancez le terminal puis: cd mobile_flutter; flutter create . ; flutter pub get ; .\build-apk.ps1" -ForegroundColor Green
