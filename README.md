# Centre Medical AMEN - FOSPHA ONGD/ASBL

Application hybride de digitalisation hospitaliere pour le Centre Medical AMEN (Kinshasa, RDC).

## Depot GitHub

- Projet: [https://github.com/Exauce09/TFC-ENGWELE.git](https://github.com/Exauce09/TFC-ENGWELE.git)

## Stack

- Backend: Laravel 11, PHP 8.3, MySQL 8.0, Sanctum
- Frontend web: React 18, Tailwind CSS, Axios
- Mobile: React Native Expo SDK 51 (phase suivante)
- Integrations: FCM, AfricasTalking, Airtel Money, M-Pesa, Jitsi Meet

## Structure

- `backend/`: API REST Laravel
- `frontend/`: interface web React
- `docs/`: documentation academique TFC (conception + implementation)

## Lancement rapide

### Backend

1. Aller dans `backend`
2. Installer les dependances (`composer install`)
3. Configurer `.env` puis executer `php artisan key:generate`
4. Verifier l'alias middleware `role` dans `bootstrap/app.php` (Laravel 11)
4. Executer les migrations (`php artisan migrate --seed`)
5. Demarrer (`php artisan serve`)

### Frontend

1. Aller dans `frontend`
2. Installer les dependances (`npm install`)
3. Copier `.env.example` vers `.env` et definir `VITE_API_URL`
4. Demarrer (`npm run dev`)

## Etat actuel

Cette base initialise la phase web (authentification, routage prive, architecture par roles) et la documentation TFC.

## Comptes de demo (seeders)

- Admin: `admin@amen.cd` / `Password@123`
- Medecin: `medecin@amen.cd` / `Password@123`
- Patient: `patient@amen.cd` / `Password@123`
