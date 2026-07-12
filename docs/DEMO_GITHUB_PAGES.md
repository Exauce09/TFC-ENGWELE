# Demo GitHub Pages — Centre Medical AMEN

> Demo web accessible depuis n'importe ou (ex. Lubumbashi), sans Wi-Fi local.

## URL de la demo

**https://exauce09.github.io/TFC-ENGWELE/**

(Mise en ligne automatique a chaque push sur `main`.)

---

## Ce que voit le visiteur

| Element | Detail |
|---------|--------|
| Interface complete | Landing, login, dashboards, design AMEN |
| Navigation | Toutes les pages web React |
| Connexion / donnees | Necessite une **API publique** (voir ci-dessous) |

Sans API en ligne, le site **s'affiche** mais la connexion echoue (« serveur inaccessible »).

---

## Activer GitHub Pages (une seule fois)

1. Ouvrez : https://github.com/Exauce09/TFC-ENGWELE/settings/pages
2. **Source** : `GitHub Actions`
3. Enregistrez

Le workflow `.github/workflows/deploy-pages.yml` deploie automatiquement.

---

## Connexion fonctionnelle depuis Lubumbashi (API publique)

GitHub Pages heberge **uniquement le frontend**. Pour que le login marche a distance :

### Option A — API sur Render (gratuit, recommande)

1. Creez un compte sur [render.com](https://render.com)
2. Deployez le dossier `backend-runtime/` (Web Service PHP)
3. Copiez l'URL publique, ex. `https://amen-api.onrender.com`
4. Sur GitHub : **Settings → Secrets and variables → Actions → Variables**
   - Nom : `VITE_API_URL`
   - Valeur : `https://amen-api.onrender.com/api/v1`
5. Relancez le workflow : **Actions → Deploy demo web → Run workflow**

### Option B — Demo visuelle seulement

Sans variable `VITE_API_URL`, le visiteur peut :
- Voir la page d'accueil
- Voir l'ecran de connexion
- Explorer le design

---

## Comptes demo (quand l'API est en ligne)

`Password@123` — `patient@amen.cd`, `medecin@amen.cd`, `admin@amen.cd`

---

## Lien a partager

Envoyez ce lien a votre contact a Lubumbashi :

```
https://exauce09.github.io/TFC-ENGWELE/
```

Page de connexion directe :

```
https://exauce09.github.io/TFC-ENGWELE/login
```

---

## Depannage

| Probleme | Solution |
|----------|----------|
| Page blanche | Verifiez que Pages est sur « GitHub Actions » |
| 404 sur /login | Attendez le deploiement (2-3 min apres push) |
| Serveur inaccessible | Ajoutez `VITE_API_URL` (API publique) et redeployez |
| CORS | Origine `https://exauce09.github.io` deja autorisee dans `cors.php` |
