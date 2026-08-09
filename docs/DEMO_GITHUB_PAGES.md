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

Sans API en ligne, le site **s'affiche** mais la connexion utilisait l'API locale.

**Mode démo intégré** : sur GitHub Pages, connectez-vous avec les comptes démo (`Password@123`) pour accéder à tous les espaces utilisateurs avec des **données simulées**.

---

## Activer GitHub Pages (une seule fois)

1. Ouvrez : https://github.com/Exauce09/TFC-ENGWELE/settings/pages
2. **Source** : `Deploy from a branch`
3. **Branch** : `gh-pages` → dossier `/ (root)`
4. Cliquez **Save**

Attendez 1-2 minutes apres le deploiement (onglet **Actions**).

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

## Comptes demo (mode démo GitHub Pages)

Mot de passe : `Password@123`

`admin@amen.cd` · `receptionniste@amen.cd` · `medecin@amen.cd` · `laborantin@amen.cd` · `pharmacien@amen.cd` · `caissier@amen.cd` · `sagefemme@amen.cd` · `chirurgien@amen.cd` · `echographiste@amen.cd` · `kine@amen.cd` · `dentiste@amen.cd` · `patient@amen.cd`

Données simulées pour labo, pharmacie, caisse, spécialités et téléconsultation.

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
