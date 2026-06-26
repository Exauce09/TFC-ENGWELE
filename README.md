# Centre Medical AMEN - FOSPHA ONGD/ASBL

Application hybride de digitalisation hospitaliere pour le Centre Medical AMEN (Kinshasa, RDC).

## Depot GitHub

- Projet : [https://github.com/Exauce09/TFC-ENGWELE](https://github.com/Exauce09/TFC-ENGWELE)

## Stack

- **Backend** : Laravel 11, PHP 8.3, Sanctum, SQLite (dev) / MySQL (prod)
- **Frontend** : React 18, Vite, Tailwind CSS, Axios
- **Mobile** : React Native Expo (phase suivante)
- **Integrations** : FCM, AfricasTalking, Airtel Money, M-Pesa, Jitsi Meet

## Structure

```
hopital-amen/
├── backend-runtime/    # API Laravel (execution)
├── frontend/           # Interface web React
├── mobile/             # Application mobile Expo
├── docs/               # Documentation TFC + production
├── deploy/             # Config Nginx exemple
├── start-backend.ps1   # Demarrage API locale
├── start-frontend.ps1  # Demarrage Vite
├── start-mobile.ps1    # Demarrage Expo
└── build-production.ps1
```

## Lancement rapide (developpement)

### Terminal 1 — Backend

```powershell
.\start-backend.ps1
```

API : http://127.0.0.1:8000

### Terminal 2 — Frontend

```powershell
.\start-frontend.ps1
```

Web : http://localhost:5173

### Terminal 3 — Mobile (Expo)

```powershell
.\start-backend.ps1    # requis pour l'API
.\start-mobile.ps1
```

Puis scanner le QR code avec **Expo Go** (Android/iOS).

Configurer `mobile/.env` :
- Emulateur Android : `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000/api/v1`
- Appareil physique : IP Wi-Fi du PC (ex. `http://192.168.1.10:8000/api/v1`)

### Premier lancement

```powershell
cd backend-runtime
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
```

```powershell
cd frontend
npm install
copy .env.example .env
```

## Production

Voir le guide complet : [`docs/PRODUCTION.md`](docs/PRODUCTION.md)

```powershell
.\build-production.ps1
```

## Documentation TFC

| Document | Fichier |
|----------|---------|
| Chapitre I — Conception | `docs/CHAPITRE_1_CONCEPTION.md` |
| Chapitre III — Analyse et conception | `docs/CHAPITRE_3_ANALYSE_CONCEPTION.md` |
| Chapitre IV — Implementation et tests | `docs/CHAPITRE_4_IMPLEMENTATION.md` |
| Guide production | `docs/PRODUCTION.md` |
| Feuille de route mobile | `docs/ROADMAP_MOBILE.md` |
| Feuille de route | `docs/ROADMAP_WEB.md` |

## Comptes demo (`Password@123`)

| Role | Email |
|------|-------|
| Admin | `admin@amen.cd` |
| Medecin | `medecin@amen.cd` |
| Patient | `patient@amen.cd` |
| Caissier | `caissier@amen.cd` |
| Infirmier | `infirmier@amen.cd` |
| Laborantin | `laborantin@amen.cd` |
| Pharmacien | `pharmacien@amen.cd` |
| Receptionniste | `receptionniste@amen.cd` |
| Sage-femme | `sage-femme@amen.cd` |
| Chirurgien | `chirurgien@amen.cd` |
| Echographiste | `echographiste@amen.cd` |
| Kinesitherapeute | `kinesitherapeute@amen.cd` |
| Dentiste | `dentiste@amen.cd` |

## Etat du projet

Feuille de route web **complete** (phases 0 a 6).  
Application mobile : **phase 0 terminee** (auth + navigation patient) — voir [`docs/ROADMAP_MOBILE.md`](docs/ROADMAP_MOBILE.md).
