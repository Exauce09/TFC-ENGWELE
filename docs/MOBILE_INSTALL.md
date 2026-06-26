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

1. Ouvrez le lien de telechargement **sur le telephone** (ou transferez le fichier `.apk`)
2. Android demande d'autoriser l'installation — acceptez
3. Ouvrez l'app **AMEN**
4. Connectez-vous : `patient@amen.cd` / `Password@123`

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
| « Serveur inaccessible » | Meme Wi-Fi, backend demarre, bonne IP dans `.env.production`, rebuild APK |
| Installation bloquee | Parametres → Securite → autoriser sources inconnues |
| Build EAS echoue | `npx eas-cli login`, connexion Internet stable |
| iPhone | Necessite compte Apple Developer (payant) — Android APK est gratuit |

---

## Mise a jour de l'app

Apres modification du code :

```powershell
.\build-mobile-apk.ps1
```

Reinstallez la nouvelle APK sur le telephone.
