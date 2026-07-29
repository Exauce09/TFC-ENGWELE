# Circulation de l’information et permissions — Centre Médical AMEN

**FOSPHA ONGD/ASBL — Kinshasa (RDC)**  
Document fonctionnel : qui crée, lit, modifie ou valide quelle information, et à quel moment elle circule.

---

## 1. Les 18 rôles du Centre Médical AMEN

| N° | Rôle | Mission principale |
|----|------|--------------------|
| 1 | Administrateur | Configuration, supervision, accès étendus, audit |
| 2 | Réceptionniste | Accueil, identification, orientation, demandes de RDV |
| 3 | Médecin généraliste | Consultation et décisions médicales |
| 4 | Médecin interne | Consultation médecine interne |
| 5 | Pédiatre | Consultation pédiatrique |
| 6 | Gynécologue | Consultation gynécologie / obstétrique |
| 7 | Ophtalmologue | Consultation ophtalmologie |
| 8 | Urgentiste | Prise en charge aux urgences |
| 9 | Chirurgien | Actes et suivi chirurgicaux |
| 10 | Anesthésiste | Anesthésie et suivi péri-opératoire |
| 11 | Dentiste | Soins dentaires |
| 12 | Sage-femme | Suivis de maternité |
| 13 | Infirmier(e) | Triage, constantes, soins, suivi hospitalier |
| 14 | Laborantin | Examens de laboratoire et résultats |
| 15 | Échographiste | Examens d’échographie / imagerie |
| 16 | Kinésithérapeute | Séances de rééducation |
| 17 | Pharmacien | Délivrance des ordonnances |
| 18 | Caissier | Facturation et encaissement |

*Le **patient** (espace patient) consulte en lecture seule son propre dossier.*

### Les 13 départements / services

1. Maternité · 2. Laboratoire · 3. Échographie · 4. Kinésithérapie · 5. Médecine interne · 6. Médecine générale · 7. Gynécologie obstétrique · 8. Pharmacie interne · 9. Pédiatrie · 10. Chirurgie · 11. Ophtalmologie · 12. Dentisterie · 13. Urgence médicale

---

## 2. Flux général de l’information

Réception → Médecin (consultation, ordonnance, examens, hospit.) → Labo / Écho / Pharmacie / Infirmier → retour Médecin → Caisse → (assurance si besoin).

Chaque étape = **changement de statut** qui rend la tâche visible pour le rôle suivant.

---

## 3. Matrice des permissions (résumé)

**Légende :** C créer · L lire · M modifier · V valider · A annuler · — aucun accès

| Module | Réception | Médecin* | Infirmier | Labo/Écho | Pharmacien | Caisse | Admin |
|--------|-----------|----------|-----------|-----------|------------|--------|-------|
| Accueil | C L M | L | — | — | — | L | C L M A |
| Identité patient | C L M | L | L | L | L | L | C L M A |
| Antécédents | — | C L M | L | L | L | — | C L M A |
| Consultation | — | C L M | L (hospit.) | — | — | L** | C L M A |
| Ordonnance | — | C L M | L | — | L + V | L** | C L M A |
| Demande d’examen | — | C L | L | L + V | — | L** | C L M A |
| Résultat d’examen | — | L + V | L | C L M | — | — | C L M A |
| Hospitalisation | L | C L M | L M | — | — | L** | C L M A |
| Suivi / soins | — | L | C L M | — | L | — | C L M A |
| Facture | L | L** | — | — | — | C L M | C L M A |
| Consentement | — | C L | L | — | — | — | C L M A |

\* Tous les médecins et spécialistes dans leur service.  
\*\* Caisse : éléments facturables uniquement (pas le détail clinique).

### Principes
- Pas de suppression clinique définitive → **annulation**.  
- Médecin modifie avant validation / délivrance ; après → avenant.  
- Patient : lecture seule de son dossier.  
- Confidentialité : chaque rôle ne voit que le nécessaire.

---

## 4. Disponibilité selon le statut

| Événement | Déclenché par | Visible pour |
|-----------|---------------|--------------|
| Accueil créé | Réceptionniste | Médecin / service |
| Décision examen | Médecin | Labo ou échographiste |
| Résultat prêt | Labo / écho | Médecin |
| Ordonnance émise | Médecin | Pharmacien |
| Hospitalisation | Médecin | Infirmier / service |
| Consultation clôturée | Médecin | Caissier |
| Demande RDV | Patient | Réceptionniste (confirmer / refuser) |

---

*Voir aussi : `SPEC_FONCTIONNELLE_FORMULAIRES_CIRCULATION.md` (formulaires + circulation complets).*
