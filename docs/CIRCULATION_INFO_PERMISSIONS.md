# Circulation de l’information et permissions — Centre Médical AMEN

Qui fait quoi, qui voit quoi, et comment l’information circule entre les services.  
*(Contenu fonctionnel uniquement.)*

---

## 1. Rôles du Centre Médical AMEN

### Direction et administration
1. Administrateur
2. Directeur médical *(si prévu dans l’organisation)*

### Accueil et parcours patient
3. Réceptionniste
4. Infirmier / Infirmière
5. Caissier / Caissière

### Médecins et spécialistes
6. Médecin généraliste  
7. Médecin interne  
8. Pédiatre  
9. Gynécologue  
10. Ophtalmologue  
11. Urgentiste  
12. Chirurgien  
13. Anesthésiste  

### Services techniques et spécialisés
14. Sage-femme  
15. Laborantin  
16. Échographiste  
17. Kinésithérapeute  
18. Dentiste  
19. Pharmacien  

### Usager
20. Patient *(espace personnel : lecture de son propre dossier)*

### Les 13 départements
1. Maternité  
2. Laboratoire  
3. Échographie  
4. Kinésithérapie  
5. Médecine interne  
6. Médecine générale  
7. Gynécologie-obstétrique  
8. Pharmacie interne  
9. Pédiatrie  
10. Chirurgie  
11. Ophtalmologie  
12. Dentisterie  
13. Urgence médicale  

---

## 2. Flux général de l’information (parcours patient)

```
Réceptionniste
   │  enregistre l’arrivée + crée / retrouve le dossier patient
   ▼
Infirmier (triage)
   │  prend les constantes, précise le niveau d’urgence
   ▼
Médecin
   │  lit le dossier et les antécédents
   │  remplit la consultation
   │  prescrit ordonnance / demande d’examen / hospitalisation
   ▼
Labo / Échographie          Pharmacien              Infirmier (si hospitalisation)
   │  réalise l’examen         │  délivre l’ordonnance   │  suit le patient
   │  saisit le résultat       │  marque « délivrée »    │  note soins et évolution
   ▼
Médecin
   │  lit les résultats
   │  finalise le diagnostic
   ▼
Caissier
   │  établit la facture à partir des actes réalisés
   │  enregistre le paiement
   ▼
Assurance / mutuelle (si applicable)
   │  traite la prise en charge
```

Chaque flèche = un moment où l’information passe d’un rôle à un autre.  
En pratique, c’est un **changement d’état** qui rend la tâche visible pour le rôle suivant  
(ex. examen « résultat disponible » → le médecin revoit le dossier ; ordonnance « émise » → le pharmacien la voit dans sa file).

---

## 3. Matrice des permissions par module

Légende : **C** = créer · **L** = lire · **M** = modifier · **A** = annuler · **V** = valider / délivrer · — = pas d’accès

| Module | Réception | Médecin* | Infirmier | Labo / Écho | Pharmacien | Caissier | Admin |
|---|---|---|---|---|---|---|---|
| Accueil / Réception | C L M | L | L (triage) | — | — | L | C L M A |
| Identité patient | C L M | L | L | L | L | L | C L M A |
| Antécédents médicaux | — | C L M | L | L | L | — | C L M A |
| Consultation | — | C L M | L (si hospit.) | — | — | L** | C L M A |
| Ordonnance | — | C L M | L | — | L + **V** | L** | C L M A |
| Demande d’examen | — | C L | L | L + **V** | — | L** | C L M A |
| Résultat d’examen | — | L + **V** | L | C L M | — | — | C L M A |
| Hospitalisation | L | C L M | L M | — | — | L** | C L M A |
| Suivi hospitalier | — | L M | C L M | — | — | — | C L M A |
| Soins infirmiers | — | L | C L M | — | L | — | C L M A |
| Facture | L | L** | — | — | — | C L M | C L M A |
| Prise en charge assurance | L | — | — | — | — | L | C L M A |
| Consentement / légal | — | C L | L | — | — | — | C L M A |

\* Médecin = tous les profils médicaux (généraliste, pédiatre, gynécologue, chirurgien, etc.), chacun dans son domaine.  
\*\* Lecture limitée aux éléments **facturables** (type d’acte, quantité, montant), pas aux notes cliniques détaillées.

### Rôles spécialisés (complément)
| Rôle | Accès principaux |
|---|---|
| Sage-femme | Suivis de maternité, lecture dossier patient concerné |
| Dentiste | Soins dentaires, consultation / prescription dans son service |
| Kinésithérapeute | Séances de rééducation liées au patient |
| Chirurgien / Anesthésiste | Opérations, consentements liés à l’acte |
| Patient | Lecture seule de **son** dossier (RDV, résultats, ordonnances, factures) |

### Principes
- On **n’efface pas** une donnée clinique : on **annule** (traçabilité).
- Le médecin modifie ses consultations / ordonnances **tant qu’elles ne sont pas validées ou délivrées** ; ensuite, on ajoute une correction plutôt que d’écraser l’historique.
- Le caissier ne voit pas le détail clinique (diagnostic, notes) — seulement ce qui se facture.
- Le patient ne modifie rien : consultation seule de ses propres informations.

---

## 4. Quand l’information passe au rôle suivant

| Événement | Déclenché par | Qui voit la suite |
|---|---|---|
| Accueil enregistré | Réceptionniste | Infirmier (triage), puis médecin assigné |
| Triage terminé | Infirmier | Médecin (file de consultation) |
| Décision « examen » | Médecin | Laborantin ou échographiste |
| Résultat disponible / validé | Labo / Écho | Médecin (retour sur le dossier) |
| Ordonnance émise | Médecin | Pharmacien (file de délivrance) |
| Décision « hospitalisation » | Médecin | Infirmier du service, suivi du séjour |
| Consultation clôturée | Médecin | Caissier (facturation) |
| Facture avec assurance | Caissier | Traitement de la prise en charge |

C’est le couple **état du dossier + rôle concerné** qui fait avancer le travail (listes d’attente, files de tâches), sans dépendre d’un système de notification en temps réel.

---

## 5. Confidentialité et traçabilité

- Chaque agent n’accède qu’aux informations **nécessaires à sa fonction**.
- Les notes médicales restent dans le cercle clinique.
- La facturation repose sur les **actes**, pas sur le contenu du dossier.
- Toute action importante (création, modification, validation, annulation) doit pouvoir être **attribuée à une personne** et datée.

---

## 6. Synthèse

| Question | Réponse |
|---|---|
| Qui ouvre le parcours ? | La réception |
| Qui trie l’urgence ? | L’infirmier |
| Qui décide des soins ? | Le médecin |
| Qui exécute examens / médicaments / soins ? | Labo, écho, pharmacie, infirmier |
| Qui facture ? | Le caissier |
| Qu’est-ce qui fait avancer le dossier ? | Le changement d’état + le rôle concerné |
