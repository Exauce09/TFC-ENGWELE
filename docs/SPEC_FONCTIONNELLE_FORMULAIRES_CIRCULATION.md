# Spécification fonctionnelle — Centre Médical AMEN

**FOSPHA ONGD/ASBL — Kinshasa (RDC)**  
**Objet :** fonctionnalités du système, circulation de l’information, formulaires du parcours patient et règles d’accès.

Ce document décrit **ce que le système doit faire** et **qui fait quoi**. Il ne traite pas des choix techniques d’implémentation.

---

## 1. Objectif du système

Digitaliser le parcours du patient depuis son arrivée à la réception jusqu’à la facturation et, le cas échéant, la sortie d’hospitalisation, en garantissant :

- une **identification unique** du patient ;
- une **traçabilité** des actes et des décisions ;
- une **circulation contrôlée** de l’information entre les acteurs ;
- le respect de la **confidentialité** (chaque rôle ne voit que ce qui lui est nécessaire).

---

## 2. Acteurs et rôles

| Rôle | Mission principale |
|------|--------------------|
| Réceptionniste | Enregistre l’arrivée, ouvre / retrouve le dossier, oriente vers le service |
| Médecin | Consulte, diagnostique, prescrit, décide (examens, hospitalisation, sortie) |
| Infirmier | Triage / constantes, soins, suivi hospitalier |
| Laborantin / technicien labo | Réalise les examens biologiques et saisit / joint les résultats |
| Technicien imagerie / radiologue | Réalise les examens d’imagerie et produit les comptes rendus |
| Pharmacien | Délivre les médicaments prescrits |
| Caissier | Établit et encaisse les factures |
| Gestionnaire assurance / mutuelle | Traite les prises en charge |
| Responsable hospitalisation / chambres | Affecte chambre et lit |
| Patient (espace patient) | Consulte son dossier, RDV, ordonnances, résultats, factures |
| Direction / administration | Supervision, configuration, accès étendus (audit) |

*À ajuster selon la liste exacte des rôles de l’établissement (ex. sage-femme, chirurgien, dentiste, etc.).*

---

## 3. Circulation de l’information (parcours patient)

### 3.1 Schéma du flux

1. **Réception** — crée l’accueil et le dossier patient (si nouveau), ou rouvre le dossier existant.  
2. **Médecin** — lit le dossier et les antécédents ; crée la consultation ; peut produire une ordonnance, une demande d’examen ou une demande d’hospitalisation.  
3. **Laboratoire / Imagerie** — lit la demande, réalise l’examen, saisit le résultat.  
4. **Pharmacie** — lit l’ordonnance et marque la délivrance.  
5. **Infirmier** (si hospitalisation) — assure le suivi quotidien et les soins.  
6. **Médecin** — lit les résultats, finalise le diagnostic / la décision.  
7. **Caisse** — facture les actes réalisés.  
8. **Assurance** (si applicable) — traite la prise en charge.

Chaque étape change le **statut** de l’élément concerné ; ce statut rend l’information visible pour le rôle suivant (file d’attente, tâches à traiter).

### 3.2 Déclencheurs métier (qui déclenche → qui voit la suite)

| Événement | Déclenché par | Devenu visible pour |
|-----------|---------------|---------------------|
| Accueil enregistré | Réceptionniste | Médecin / file du service |
| Décision « examen » | Médecin | Laborantin / imagerie |
| Résultat disponible / validé | Labo / imagerie | Médecin |
| Ordonnance émise | Médecin | Pharmacien |
| Décision « hospitalisation » | Médecin | Responsable chambres, puis infirmier |
| Consultation clôturée | Médecin | Caissier |
| Facture avec assurance | Caissier | Gestionnaire assurance |

---

## 4. Règles d’accès (fonctionnelles)

Légende : **Créer**, **Lire**, **Modifier**, **Valider**, **Annuler** (pas de suppression définitive des données cliniques).

| Module | Réception | Médecin | Infirmier | Labo / Imagerie | Pharmacien | Caisse | Assurance | Admin |
|--------|-----------|---------|-----------|-----------------|------------|--------|-----------|-------|
| Accueil / réception | Créer, Lire, Modifier | Lire | — | — | — | Lire | — | Tout |
| Identité patient | Créer, Lire, Modifier | Lire | Lire | Lire | Lire | Lire | Lire | Tout |
| Antécédents | — | Créer, Lire, Modifier | Lire | Lire | Lire | — | — | Tout |
| Consultation | — | Créer, Lire, Modifier | Lire (si hospit.) | — | — | Lire (éléments facturables) | — | Tout |
| Ordonnance | — | Créer, Lire, Modifier | Lire | — | Lire + Valider délivrance | Lire | — | Tout |
| Demande d’examen | — | Créer, Lire | Lire | Lire + Valider résultat | — | Lire | — | Tout |
| Résultat d’examen | — | Lire + Valider | Lire | Créer, Lire, Modifier | — | — | — | Tout |
| Hospitalisation | Lire | Créer, Lire, Modifier | Lire, Modifier | — | — | Lire | — | Tout |
| Suivi / soins infirmiers | — | Lire, Modifier | Créer, Lire, Modifier | — | Lire (dispensation) | — | — | Tout |
| Facture | Lire | Lire | — | — | — | Créer, Lire, Modifier | Lire | Tout |
| Prise en charge | Lire | — | — | — | — | Lire | Créer, Lire, Modifier | Tout |
| Consentements / légal | — | Créer, Lire | Lire | — | — | — | — | Tout |

### Principes

- Les données cliniques ne se **suppriment** pas : on **annule** (statut « annulé ») pour conserver la traçabilité.  
- Le médecin ne modifie une consultation / ordonnance qu’**avant validation ou délivrance** ; ensuite, correction = nouvel avenant / nouvelle entrée liée.  
- Le caissier ne voit pas le détail clinique (notes, diagnostic détaillé) : seulement les **actes facturables**.  
- Le patient (espace patient) : **lecture seule** de son propre dossier (consultations, ordonnances, résultats, factures, RDV).

---

## 5. Fonctionnalités par module

### 5.1 Accueil / Réception

**Fonctions :**
- Rechercher un patient existant (anti-doublon : nom, téléphone, n° dossier, photo).  
- Enregistrer une première venue ou une nouvelle visite.  
- Générer un **numéro de dossier unique**.  
- Orienter vers un département / médecin.  
- Enregistrer le mode de paiement et l’assurance éventuelle.  
- Effectuer un **pré-triage** (plainte, niveau d’urgence, allergies / antécédents signalés).

**Statuts possibles :** en attente, en consultation, terminé, annulé.

### 5.2 Consultation

**Fonctions :**
- Ouvrir une consultation liée à l’accueil et au patient.  
- Saisir les constantes vitales (dont IMC calculé).  
- Renseigner anamnèse, examen clinique, diagnostic(s).  
- Décider : ordonnance, demande d’examen, hospitalisation, renvoi, certificat.  
- Clôturer la consultation.

**Statuts :** en cours, terminée.

### 5.3 Ordonnance

**Fonctions :**
- Éditer une ordonnance liée à la consultation.  
- Afficher une **alerte allergies**.  
- Ajouter plusieurs lignes de médicaments (dosage, forme, posologie, durée, quantité, instructions).  
- Signature / cachet / durée de validité.  
- Pharmacie : marquer **délivrée** ou **annulée**.

**Statuts :** émise, délivrée, annulée.

### 5.4 Demandes et résultats d’examens

**Fonctions :**
- Prescrire un examen (biologie, imagerie, autre) avec niveau d’urgence et motif clinique.  
- Suivre le workflow : demandé → en cours → résultat disponible → validé.  
- Saisir les résultats (valeurs, unités, références, interprétation, fichiers joints).  
- Validation médicale du résultat.

### 5.5 Hospitalisation

**Fonctions :**
- Admettre le patient (motif, diagnostic d’entrée, chambre, lit, type de chambre, durée prévue).  
- Suivi quotidien (constantes, évolution, soins, infirmier).  
- Fiche de soins infirmiers (médicament, heure, voie, observations).  
- Sortie : résumé, diagnostic final, traitement de sortie, type de sortie (guérison, sur demande, transfert, décès).

**Statuts :** admis, en cours, sorti.

### 5.6 Facturation et paiement

**Fonctions :**
- Générer une facture liée à la consultation / hospitalisation.  
- Ajouter des lignes (consultation, examens, médicaments, chambre/jour…).  
- Calculer totaux, remises, part assurance, part patient, payé, reste.  
- Enregistrer le paiement (cash, mobile money, virement, assurance).  
- Gérer la prise en charge (police, montant / %, statut de l’accord).

**Statuts facture :** impayée, partiellement payée, payée.  
**Statuts prise en charge :** en attente, approuvée, refusée.

### 5.7 Dossier patient — antécédents

**Fonctions :**
- Tenir une fiche unique d’antécédents (groupe sanguin, maladies chroniques, allergies, chirurgies, obstétrique, vaccinations, famille, habitudes de vie).  
- Mise à jour continue à chaque nouvelle information pertinente.

### 5.8 Consentements et documents légaux

**Fonctions :**
- Établir consentement éclairé, décharge, certificat médical.  
- Lier à l’acte concerné (chirurgie, anesthésie, sortie contre avis…).  
- Signatures patient (ou tuteur), médecin, témoin éventuel.

### 5.9 Espace patient

**Fonctions (lecture) :**
- Voir ses rendez-vous et demandes.  
- Consulter son historique de consultations, ordonnances, résultats, factures.  
- Compléter son profil après première connexion à l’hôpital.

---

## 6. Contenu des formulaires (informations collectées)

### 6.1 Accueil / Réception

| Bloc | Informations |
|------|----------------|
| Identification | Nom, post-nom, prénom ; date de naissance ; âge (calculé) ; sexe ; état civil ; téléphone ; adresse (avenue, quartier, commune, ville) ; pièce d’identité ; photo (optionnel) |
| Administratif | N° dossier (automatique) ; date/heure d’arrivée ; type de visite (consultation, urgence, hospitalisation, suivi) ; service demandé ; médecin demandé / assigné ; mode de paiement ; n° assurance / mutuelle |
| Contact d’urgence | Nom ; lien de parenté ; téléphone |
| Pré-triage | Plainte principale ; niveau d’urgence (léger, modéré, urgent, critique) ; allergies signalées ; antécédents signalés |

### 6.2 Consultation

| Bloc | Informations |
|------|----------------|
| En-tête | N° consultation ; date/heure ; patient ; médecin ; département |
| Constantes | Tension ; température ; pouls ; fréquence respiratoire ; SpO2 ; poids ; taille ; IMC |
| Anamnèse | Motif ; histoire de la maladie ; antécédents médicaux, chirurgicaux, familiaux ; allergies ; traitement en cours |
| Examen | Observations générales ; examen par système ; notes |
| Décision | Diagnostic principal et associés ; décision (ordonnance / examen / hospitalisation / renvoi / certificat) ; recommandations |

### 6.3 Ordonnance

| Bloc | Informations |
|------|----------------|
| En-tête | N° ordonnance ; date ; médecin ; n° d’ordre ; département |
| Patient | Identité, dossier, âge/sexe, poids, allergies (alerte) |
| Contenu | Diagnostic / motif ; lignes médicaments (DCI/commercial, dosage, forme, posologie, durée, quantité, instructions) |
| Pied | Signature ; cachet ; validité |

### 6.4 Examen

| Bloc | Informations |
|------|----------------|
| Demande | N° demande ; date ; médecin ; département ; patient ; catégorie et nom d’examen ; urgence ; motif clinique |
| Réalisation | Technicien assigné ; date/heure de prélèvement ou réalisation |
| Résultat | Valeurs, unités, références, interprétation, fichiers joints |
| Validation | Médecin validateur ; date ; signature |

### 6.5 Hospitalisation

| Bloc | Informations |
|------|----------------|
| Admission | N° hospitalisation ; patient ; date ; médecin ; service ; motif ; diagnostic d’entrée ; chambre ; lit ; type de chambre ; durée prévue |
| Suivi | Date/heure ; constantes ; évolution ; soins ; infirmier |
| Soins | Médicament ; heure ; voie ; infirmier ; observations |
| Sortie | Date ; résumé ; diagnostic final ; traitement de sortie ; recommandations ; type de sortie |

### 6.6 Facturation

| Bloc | Informations |
|------|----------------|
| Facture | N° ; date ; patient ; lien consultation / hospitalisation |
| Lignes | Prestation ; quantité ; prix unitaire ; sous-total |
| Totaux | Total ; remise ; part assurance ; part patient ; payé ; reste |
| Paiement | Mode ; n° transaction ; date |
| Assurance | Organisme ; n° police ; montant/% ; statut de l’accord |

### 6.7 Antécédents

Groupe sanguin / rhésus ; maladies chroniques ; allergies ; chirurgies ; obstétrique ; vaccinations ; antécédents familiaux ; tabac, alcool, activité physique.

### 6.8 Consentement / documents

N° document ; patient ; type ; acte concerné ; texte ; date ; signatures (patient/tuteur, médecin, témoin).

---

## 7. Synthèse des modules fonctionnels

| Module | Fonction principale |
|--------|---------------------|
| Accueil / Réception | Enregistrer et orienter le patient |
| Consultation | Prendre en charge médicalement la visite |
| Ordonnance | Prescrire et délivrer les médicaments |
| Examens | Demander, réaliser et valider les examens |
| Hospitalisation | Admettre, soigner, suivre et sortir le patient |
| Facturation | Facturer et encaisser / gérer l’assurance |
| Antécédents | Centraliser l’historique de santé |
| Consentements | Formaliser les actes légaux |
| Espace patient | Permettre au patient de consulter ses informations |

---

## 8. Exigences transversales (non techniques)

- **Unicité du patient** : un seul dossier par personne (recherche avant création).  
- **Numérotation automatique** : dossier, consultation, ordonnance, demande d’examen, hospitalisation, facture.  
- **Traçabilité** : savoir qui a créé / modifié / validé / annulé, et quand.  
- **Confidentialité** : accès limité au besoin métier.  
- **Continuité** : le médecin retrouve toujours le fil (résultats, antécédents, décisions).  
- **Facturation liée aux actes** : seuls les actes réalisés alimentent la facture.

---

*Document fonctionnel dérivé des notes « Formulaires principaux » et « Circulation de l’information & permissions » du Centre Médical AMEN.*
