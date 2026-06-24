# Demarrer le backend API (SQLite + Sanctum)
$phpPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
Set-Location "$PSScriptRoot\backend-runtime"
& $phpPath artisan serve --host=127.0.0.1 --port=8000
