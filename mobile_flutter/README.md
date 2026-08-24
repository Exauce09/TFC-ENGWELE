# AMEN Mobile (Flutter)

MVP Patient — API Laravel Sanctum.

## Setup rapide

1. Installer Flutter SDK (ou attendre la fin du téléchargement) :
   ```powershell
   .\install-flutter-sdk.ps1
   ```
2. Android Studio + SDK (licences) :
   ```powershell
   flutter doctor --android-licenses
   ```
3. Régénérer les plateformes si besoin :
   ```powershell
   flutter create . --project-name amen_mobile --org cd.amen
   ```
4. Dépendances + APK :
   ```powershell
   flutter pub get
   .\build-apk.ps1
   ```

API : `lib/config/api_config.dart` ou `--dart-define=API_BASE_URL=...`

Doc complète : `../docs/MOBILE_FLUTTER.md`
