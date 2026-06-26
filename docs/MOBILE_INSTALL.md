# Installer AMEN sur telephone (APK Android)

> Sans Expo Go — application installee comme une vraie app.

## Prerequis

| Element | Detail |
|---------|--------|
| Compte Expo | Gratuit sur [expo.dev](https://expo.dev/signup) |
| Telephone Android | Autoriser « sources inconnues » pour installer l'APK |
| API accessible | Le telephone doit joindre l'URL dans `.env.production` |

**Important :** une APK avec `http://192.168.x.x:8000` ne fonctionne que si le telephone est sur le **meme Wi-Fi** que le PC et que le backend tourne. Pour usage partout, deployez l'API en ligne (`docs/PRODUCTION.md`).

---

## Etape 1 — Configurer l'URL de l'API

```powershell
cd mobile
copy .env.production.example .env.production
```

Editez `.env.production` avec l'IP de votre PC ou l'URL production :

```env
EXPO_PUBLIC_API_URL=http://10.148.79.54:8000/api/v1
```

Trouver l'IP du PC :

```powershell
ipconfig
```

---

## Etape 2 — Se connecter a Expo (une seule fois)

```powershell
cd mobile
npx eas-cli login
```

Creez un compte gratuit si besoin.

---

## Etape 3 — Generer l'APK (cloud, ~15 min)

A la racine du projet :

```powershell
.\build-mobile-apk.ps1
```

Ou manuellement :

```powershell
cd mobile
npx eas-cli build -p android --profile preview
```

A la fin, Expo affiche un **lien de telechargement** de l'APK.

---

## Etape 4 — Installer sur le telephone

### Methode A — Lien direct (sur le telephone Android)

1. Ouvrez ce lien **dans Chrome sur le telephone** (pas sur PC) :
   **https://expo.dev/artifacts/eas/XWKLy_d_rzP8TUm92Rs4zoWYnAMITboE51jKffkOm34.apk**
2. Le fichier `AMEN` se telecharge (onglet Notifications ou dossier **Telechargements**)
3. Appuyez sur le fichier `.apk` telecharge
4. Si Android bloque : **Parametres** → autoriser **Chrome** (ou **Fichiers**) a **installer des applications inconnues**
5. Relancez l'installation

### Methode B — Via le PC (cable USB ou WhatsApp)

1. Fichier sur le PC : `releases/AMEN-v1.0.0.apk`
2. Envoyez-le sur le telephone (USB, WhatsApp a vous-meme, Bluetooth, Google Drive)
3. Sur le telephone, ouvrez le fichier avec **Mes fichiers** / **Gestionnaire de fichiers**
4. Autorisez l'installation si demande

### Methode C — Page Expo

1. Ouvrez : https://expo.dev/accounts/exauce-tsh/projects/amen-mobile/builds
2. Build **preview** termine → bouton **Download**
3. Installez l'APK

### Apres installation

1. Ouvrez l'app **AMEN**
2. Connectez-vous : `patient@amen.cd` / `Password@123`

---

## Backend pour test local

Pendant les tests avec IP locale, le backend doit ecouter sur le reseau :

```powershell
.\start-backend.ps1
```

(`0.0.0.0:8000` — deja configure)

---

## Depannage

| Probleme | Solution |
|----------|----------|
| « Telechargement bloque » | Utilisez Chrome sur Android, pas le navigateur in-app Facebook/WhatsApp |
| « Installation bloquee » | Parametres → Applications → Chrome → **Installer des apps inconnues** → Autoriser |
| « Fichier dangereux » | Android affiche un avertissement — appuyez sur **Installer quand meme** / **Details** puis installer |
| « Analyse impossible » | Retelechargez l'APK ; verifiez l'espace disque (> 100 Mo libre) |
| « Application non installee » | Desinstallez une ancienne version AMEN ; redemarrez le telephone |
| « Serveur inaccessible » (app installee) | 1) Meme Wi-Fi 2) `.\start-backend.ps1` 3) Autoriser HTTP : rebuild APK avec `usesCleartextTraffic` 4) Pare-feu Windows port 8000 |
| Build EAS echoue | `npx eas-cli login`, connexion Internet stable |
| iPhone | APK Android uniquement — iPhone necessite build iOS (compte Apple payant) |

---

## Mise a jour de l'app

Apres modification du code :

```powershell
.\build-mobile-apk.ps1
```

Reinstallez la nouvelle APK sur le telephone.
