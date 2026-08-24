# Génère un keystore de release (une seule fois) et configure le signing Android.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$keyDir = Join-Path $PSScriptRoot "android\keystore"
New-Item -ItemType Directory -Force -Path $keyDir | Out-Null
$keystore = Join-Path $keyDir "amen-release.jks"
$props = Join-Path $PSScriptRoot "android\key.properties"

if (-not (Test-Path $keystore)) {
  $keytool = Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Recurse -Filter keytool.exe -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName
  if (-not $keytool) { $keytool = "keytool" }
  & $keytool -genkeypair -v `
    -keystore $keystore `
    -alias amen `
    -keyalg RSA -keysize 2048 -validity 10000 `
    -storepass amen_release_change_me `
    -keypass amen_release_change_me `
    -dname "CN=Centre Medical AMEN, OU=Mobile, O=AMEN, L=Kinshasa, C=CD"
  Write-Host "Keystore créé : $keystore" -ForegroundColor Green
}

@"
storePassword=amen_release_change_me
keyPassword=amen_release_change_me
keyAlias=amen
storeFile=keystore/amen-release.jks
"@ | Set-Content -Path $props -Encoding ASCII

Write-Host "Écrit : $props" -ForegroundColor Green
Write-Host "Changez les mots de passe avant une distribution large." -ForegroundColor Yellow
