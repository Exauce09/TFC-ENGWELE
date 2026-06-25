# Guide de déploiement — Centre Médical AMEN

> Dépôt : [https://github.com/Exauce09/TFC-ENGWELE](https://github.com/Exauce09/TFC-ENGWELE)

## Architecture production cible

```
[Navigateur] → HTTPS → Nginx
                         ├── /          → fichiers statiques React (frontend/dist)
                         └── /api       → Laravel (backend-runtime/public)
                                              └── MySQL 8.0
```

## Prérequis serveur

| Composant | Version minimale |
|-----------|------------------|
| PHP | 8.3 + extensions: mbstring, pdo_mysql, openssl, tokenizer, xml, ctype, json, bcmath |
| Composer | 2.x |
| MySQL | 8.0 |
| Nginx ou Apache | avec rewrite URL |
| Node.js | 18+ (uniquement pour le build frontend) |
| Certificat SSL | Let's Encrypt recommandé |

## 1. Préparation du code

```bash
git clone https://github.com/Exauce09/TFC-ENGWELE.git
cd TFC-ENGWELE
```

### Backend

```bash
cd backend-runtime
composer install --no-dev --optimize-autoloader
cp .env.production.example .env
php artisan key:generate
```

Configurer `.env` production :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://amen.votredomaine.cd

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amen_production
DB_USERNAME=amen_user
DB_PASSWORD=<mot_de_passe_fort>

MOBILE_MONEY_MOCK=false
FCM_ENABLED=true
AT_ENABLED=true
```

Puis :

```bash
php artisan migrate --force
# En production réelle : ne pas lancer les seeders démo
# php artisan db:seed --force   ← développement / démo uniquement

php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend

```bash
cd ../frontend
npm ci
cp .env.production.example .env.production
# VITE_API_URL=https://amen.votredomaine.cd/api/v1
npm run build
```

Le dossier `frontend/dist/` contient les fichiers statiques à servir.

**Windows (script fourni) :**

```powershell
.\build-production.ps1
```

## 2. Configuration Nginx

Exemple dans `deploy/nginx-amen.example.conf`. Points clés :

- Racine SPA : `frontend/dist` avec fallback `index.html`
- API Laravel : `backend-runtime/public` sur `/api` ou sous-domaine `api.amen.cd`
- HTTPS obligatoire
- Headers de sécurité (`X-Frame-Options`, `X-Content-Type-Options`)

## 3. Permissions Laravel

```bash
chown -R www-data:www-data backend-runtime/storage backend-runtime/bootstrap/cache
chmod -R 775 backend-runtime/storage backend-runtime/bootstrap/cache
```

## 4. CORS et Sanctum

Dans `backend-runtime/config/cors.php`, ajouter le domaine production :

```php
'allowed_origins' => [
    'https://amen.votredomaine.cd',
],
```

Variables `.env` :

```env
SANCTUM_STATEFUL_DOMAINS=amen.votredomaine.cd
SESSION_DOMAIN=.votredomaine.cd
```

## 5. Tâches planifiées (recommandé)

```cron
* * * * * cd /var/www/amen/backend-runtime && php artisan schedule:run >> /dev/null 2>&1
```

File d'attente (notifications, SMS) :

```bash
php artisan queue:work --daemon
```

## 6. Sauvegarde

- **Base MySQL** : dump quotidien (`mysqldump amen_production`)
- **Fichiers** : `storage/` Laravel
- **Code** : dépôt GitHub (source de vérité)

## 7. Vérification post-déploiement

| Test | Commande / action |
|------|-------------------|
| API accessible | `curl https://amen.votredomaine.cd/api/v1/departements` |
| Login | POST `/api/v1/login` avec compte admin |
| Frontend | Ouvrir `https://amen.votredomaine.cd` |
| HTTPS | Certificat valide, pas de mixed content |
| Build frontend | `VITE_API_URL` pointe vers l'API production |

## 8. Développement local (rappel)

```powershell
.\start-backend.ps1    # API → http://127.0.0.1:8000
.\start-frontend.ps1   # Web → http://localhost:5173
```

Comptes démo : voir `docs/ROADMAP_WEB.md` et page Login.

## 9. Perspectives

- Hébergement cloud (VPS OVH, DigitalOcean, AWS Lightsail)
- CDN pour les assets statiques
- Application mobile React Native (même API)
- Monitoring (Sentry, logs centralisés)
