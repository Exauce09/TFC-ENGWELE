# TFC L3 LMD - Digitalisation Hospitaliere

## Informations generales

- **Sujet**: Conception et implementation d'une application hybride de digitalisation hospitaliere
- **Institution**: FOSPHA ONGD/ASBL - Centre Medical AMEN
- **Localisation**: Kinshasa, RDC
- **Lien du depot**: [https://github.com/Exauce09/TFC-ENGWELE.git](https://github.com/Exauce09/TFC-ENGWELE.git)

## Resume

Ce travail presente la conception et l'implementation d'une plateforme numerique pour la gestion des activites cliniques, administratives et financieres d'un centre medical. La solution cible le web et le mobile, avec une API unifiee, une gestion stricte des roles, et des integrations locales (Mobile Money, SMS, notifications push).

## Introduction

La gestion hospitaliere manuelle entraine des pertes d'information, des delais dans la prise en charge et une faible tracabilite. Le Centre Medical AMEN necessite une solution integree couvrant:

- la prise de rendez-vous;
- le suivi medical multidisciplinaire;
- la facturation et les paiements;
- la communication patient-personnel.

L'objectif est de proposer une architecture robuste, securisee et evolutive, adaptee au contexte de Kinshasa.

> **Redaction complete du chapitre Conception** : voir [docs/CHAPITRE_1_CONCEPTION.md](./CHAPITRE_1_CONCEPTION.md)

## Chapitre 1 - Conception (synthese)

### 1.1 Analyse des besoins

#### Besoins fonctionnels

- Gestion des comptes et authentification securisee.
- Gestion des rendez-vous par departement et medecin.
- Tenue du dossier medical numerique.
- Production des diagnostics, prescriptions et resultats d'examens.
- Gestion pharmacie, soins infirmiers, chirurgie, maternite.
- Facturation et paiements (cash, Airtel Money, M-Pesa).
- Notifications in-app, push et SMS.
- Tableau de bord administratif et reporting.

#### Besoins non fonctionnels

- Securite (controle d'acces par role, tokens, validation stricte).
- Disponibilite et performance (cache Redis, pagination).
- Traçabilite (historique, logs applicatifs sans donnees sensibles).
- Evolutivite (API REST versionnee, architecture modulaire).

### 1.2 Acteurs et roles

Le systeme gere 18 roles: patient, medecins consultants, sage-femme, chirurgien, anesthesiste, laborantin, echographiste, kinesitherapeute, dentiste, pharmacien, infirmier, urgentiste, caissier, receptionniste et administrateur.

### 1.3 Modelisation des donnees

La base relationnelle comprend 19 tables principales:

- `departements`, `users`, `patients`, `medecins`
- `rendez_vous`, `dossiers_medicaux`, `diagnostics`, `prescriptions`
- `analyses_laboratoire`, `resultats_echographie`, `seances_kinesitherapie`
- `soins_dentaires`, `operations_chirurgicales`, `suivis_maternite`, `soins_infirmiers`
- `stock_medicaments`, `factures`, `paiements`, `notifications`

Les cles etrangeres assurent l'integrite referentielle entre le patient, le personnel soignant, les actes medicaux et la facturation.

### 1.4 Architecture technique

- **Backend**: Laravel 11 + Sanctum (API REST `v1`).
- **Frontend Web**: React 18 + Tailwind + Axios.
- **Mobile**: React Native Expo (phase 2).
- **Data**: MySQL 8.0.
- **Integrations**: Firebase FCM, AfricasTalking, Airtel Money, M-Pesa, Jitsi Meet.

### 1.5 Securite et gouvernance

- Controle d'acces RBAC via middleware de roles.
- Validation des requetes cote serveur.
- Hashage des mots de passe.
- Tokens limites a 24h.
- Standardisation des reponses API.

## Chapitre 2 - Implementation

> **Redaction complete** :
> - Chapitre III (analyse et conception) : [docs/CHAPITRE_3_ANALYSE_CONCEPTION.md](./CHAPITRE_3_ANALYSE_CONCEPTION.md)
> - Chapitre IV (implementation et tests) : [docs/CHAPITRE_4_IMPLEMENTATION.md](./CHAPITRE_4_IMPLEMENTATION.md)

### 2.1 Mise en place backend

- Creation de l'API versionnee sous `routes/api.php`.
- Middleware `RoleMiddleware` pour filtrer les routes par metier.
- `AuthController` pour inscription patient, connexion, deconnexion et profil.
- Structuration des controllers metier par service hospitalier.

### 2.2 Mise en place frontend web

- Configuration d'Axios (`src/services/api.js`) avec token Bearer.
- Gestion de session via `AuthContext`.
- Protection des pages par `PrivateRoute` et `allowedRoles`.
- Dashboards separes selon le role.

### 2.3 Choix de conception

- **API first** pour faciliter le web et le mobile.
- **Separation des responsabilites**: controllers, services, middleware.
- **Conventions de nommage** uniformes (tables, routes, composants).
- **Interfaces role-based** pour limiter la complexite par profil.

### 2.4 Difficultes previsibles

- Interoperabilite des APIs Mobile Money.
- Qualite reseau sur mobile et notifications en contexte local.
- Adoption utilisateur et conduite du changement.

### 2.5 Strategie de tests

- Tests unitaires Laravel pour services critiques.
- Tests d'integration API (auth, rdv, facturation).
- Tests UI React pour flux de connexion et pages protegees.
- Recettes par role metier avec jeux de donnees de demonstration.
- Build production valide (`npm run build`).

### 2.6 Deploiement production

> Guide detaille : [docs/PRODUCTION.md](./PRODUCTION.md)

- Build frontend (`build-production.ps1`) → `frontend/dist/`
- Backend Laravel optimise (`config:cache`, `route:cache`)
- MySQL 8.0, HTTPS, Nginx
- Variables `.env.production.example` fournies

## Chapitre 3 - Resultats attendus

- Reduction du temps de traitement des dossiers.
- Meilleure tracabilite des actes medicaux.
- Diminution des erreurs de saisie et de facturation.
- Amelioration de la communication patient-hopital.

## Conclusion et perspectives

La solution proposee pose une base solide pour la transformation numerique du Centre Medical AMEN. Les perspectives incluent:

- deploiement progressif mobile;
- tableaux de bord decisionnels avances;
- telemedecine et intelligence analytique.

## Annexes techniques

### A. Variables d'environnement minimales

- Backend: `APP_URL`, `DB_*`, `SANCTUM_STATEFUL_DOMAINS`, `MAIL_*`, `REDIS_*`.
- Frontend: `VITE_API_URL`.

### B. Livrables

- Code source backend et frontend.
- Scripts de migration/seeding.
- Documentation technique et academique.
- Cahier de tests fonctionnels par role.
