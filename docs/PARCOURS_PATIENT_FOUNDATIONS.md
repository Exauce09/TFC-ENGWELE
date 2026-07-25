# Parcours Patient AMEN — 9 étapes

## Flux métier

1. **Accueil** (réceptionniste) — identité, motif, prise en charge → triage  
2. **Triage** (infirmier) — constantes, urgence → médecin  
3. **Consultation médicale** (médecin) — anamnèse, examen, hypothèses → prélèvement **ou** diagnostic direct  
4. **Prélèvement** (infirmier, optionnel) → laboratoire  
5. **Analyses** (laborantin, optionnel) — résultats au médecin  
6. **Diagnostic & prescription** (médecin) → pharmacie  
7. **Délivrance** (pharmacien) → retour médecin  
8. **Initiation du traitement** (médecin)  
9. **Suivi** — RDV de contrôle  

## Statuts techniques

```
enregistre → triage → consultation_medicale
  → prelevement → examens_laboratoire   (optionnels)
  → diagnostic_prescription → delivrance_medicaments
  → initiation_traitement → suivi
```

## API `/api/v1/admissions`

| Méthode | Endpoint | Rôle |
|---------|----------|------|
| POST | `/` | réceptionniste |
| PATCH | `/{id}/triage` | infirmier |
| PATCH | `/{id}/consultation` | médecin |
| PATCH | `/{id}/prelevement` | infirmier |
| POST | `/{id}/examens` | médecin / laborantin |
| PATCH | `/{id}/diagnostic` | médecin |
| POST | `/{id}/prescription` | médecin / pharmacien |
| PATCH | `/{id}/initiation` | médecin |
| PATCH | `/{id}/suivi` | médecin / réception |

## Frontend

- `/parcours` — liste + enregistrement  
- `/parcours/:id` — dossier unique (cartes + modals, sans reload)  
