# Application Flutter AMEN (MVP Patient)

Remplace progressivement l’app Expo (`mobile/`) par Flutter (`mobile_flutter/`), en consommant la **même API Laravel** (`/api/v1`, Sanctum).

## Prérequis

1. [Flutter SDK Windows](https://docs.flutter.dev/get-started/install/windows) (stable)
2. Android Studio + SDK Android + licences (`flutter doctor --android-licenses`)
3. Backend Laravel démarré (`start-backend.ps1`) **ou** API en ligne

Si le zip Flutter est déjà téléchargé dans `%TEMP%\flutter_windows.zip` :

```powershell
cd mobile_flutter
.\install-flutter-sdk.ps1
```

Vérifier :

```powershell
flutter doctor
```

## Configuration de l’API

### API en ligne (recommandé pour le téléphone)

1. Backend local : `.\start-backend.ps1`
2. Tunnel HTTPS public : `.\start-api-online.ps1` (laisse la fenêtre ouverte)
3. Rebuild APK : `cd mobile_flutter; .\build-apk.ps1`  
   (lit automatiquement `.api-public-url`)

L’URL Cloudflare (`*.trycloudflare.com`) change à chaque redémarrage du tunnel : rebuild l’APK après.

### IP locale (même Wi‑Fi)

Éditez [`lib/config/api_config.dart`](../mobile_flutter/lib/config/api_config.dart) :

```dart
defaultValue: 'http://10.210.85.54:8000/api/v1',
```

Ou au build :

```powershell
flutter build apk --release --dart-define=API_BASE_URL=https://votre-domaine.cd/api/v1
```

HTTP local : cleartext est autorisé dans Android (`usesCleartextTraffic`).

## Lancer en debug

```powershell
cd mobile_flutter
flutter pub get
flutter run
```

## Build APK

```powershell
cd mobile_flutter
.\build-apk.ps1
```

Ou :

```powershell
flutter build apk --release
```

APK généré :
- `mobile_flutter/build/app/outputs/flutter-apk/app-release.apk`
- copie : `releases/AMEN-flutter-v1.0.0.apk`

Sur Windows, si `flutter` n’est pas dans le PATH, utilisez `C:\flutter\bin\flutter.bat` (ou rouvrez le terminal après installation).

## Fonctionnalités V1

### Offline + sync
- SQLite locale (Drift) + file `sync_outbox`
- Lecture cache hors ligne ; mutations synchronisées dès le retour réseau
- Bandeau d’état + écran « Actions en attente »

### Patient
- Première connexion, dashboard, RDV (créneaux / reporter / annuler), factures, dossier, profil, notifications, téléconsultation (online)

### Médecin
- Dashboard, planning, file (+ décision / avancer), patients + détail, dossiers CRUD, prescriptions, téléconsultation, profil

### Autres rôles
- Écran placeholder (hors priorité)

## API production

Voir [`docs/API_RENDER.md`](API_RENDER.md) (`render.yaml` + Docker).

## Structure

```
mobile_flutter/
  lib/
    config/api_config.dart
    models/
    providers/auth_provider.dart
    services/   # api_client, auth, patient
    screens/    # login + patient/*
    router/app_router.dart
    main.dart
```

## Expo

Le dossier `mobile/` (Expo) reste disponible jusqu’à couverture complète des rôles en Flutter.
