# Diagrammes UML — Centre Médical AMEN

À coller dans le mémoire (exporteruer Mermaid → PNG via [mermaid.live](https://mermaid.live) ou VS Code).

---

## 1. Diagramme de classes

```mermaid
classDiagram
  direction TB

  class User {
    +id
    +name
    +email
    +role
    +phone
  }

  class Patient {
    +id
    +numero_patient
    +sexe
    +allergies
  }

  class Medecin {
    +id
    +specialite
    +disponibilites
  }

  class Departement {
    +id
    +code
    +nom
  }

  class Admission {
    +id
    +numero_admission
    +statut
    +mode_arrivee
    +motif_arrivee
  }

  class Triage {
    +id
    +niveau_urgence
    +temperature
    +tension_arterielle
  }

  class Consultation {
    +id
    +anamnese
    +examen_clinique
    +diagnostic_final
  }

  class ExamenLabo {
    +id
    +type_examen
    +priorite
    +statut
    +resultats
  }

  class ParcoursPrescription {
    +id
    +numero_ordonnance
    +medicaments
    +statut
  }

  class RendezVous {
    +id
    +date_rdv
    +heure_rdv
    +statut
    +type
  }

  User "1" --> "0..1" Patient : possede
  User "1" --> "0..1" Medecin : possede
  Departement "1" --> "*" Medecin : emploie
  Patient "1" --> "*" Admission : subit
  Patient "1" --> "*" RendezVous : reserve
  Medecin "1" --> "*" RendezVous : assure
  Medecin "1" --> "*" Admission : referent
  Admission "1" --> "0..1" RendezVous : origine
  Admission "1" --> "0..1" Triage : a
  Admission "1" --> "*" Consultation : contient
  Admission "1" --> "*" ExamenLabo : prescrit
  Admission "1" --> "*" ParcoursPrescription : genere
  Medecin "1" --> "*" Consultation : realise
  Medecin "1" --> "*" ParcoursPrescription : prescrit
```

---

## 2. Diagramme de cas d'utilisation

```mermaid
flowchart LR
  subgraph Systeme["Système AMEN"]
    UC1((UC1 Enregistrer patient))
    UC2((UC2 Faire triage))
    UC3((UC3 Consulter et prescrit examens))
    UC4((UC4 Prelever echantillon))
    UC5((UC5 Publier resultats))
    UC6((UC6 Diagnostiquer et prescrit))
    UC7((UC7 Delivrer medicaments))
    UC8((UC8 Initier traitement))
    UC9((UC9 Prendre RDV creneau))
    UC10((UC10 Convertir RDV jour J))
  end

  Rec[Receptionniste]
  Inf[Infirmier]
  Med[Medecin]
  Lab[Laborantin]
  Pha[Pharmacien]
  Pat[Patient]

  Rec --> UC1
  Rec --> UC10
  Inf --> UC2
  Inf --> UC4
  Med --> UC3
  Med --> UC6
  Med --> UC8
  Lab --> UC5
  Pha --> UC7
  Pat --> UC9
```

---

## 3. Diagrammes de séquence (2 scénarios)

### Scénario A — Patient walk-in jusqu'à l'initiation du traitement

```mermaid
sequenceDiagram
  autonumber
  actor Rec as Receptionniste
  actor Inf as Infirmier
  actor Med as Medecin
  actor Lab as Laborantin
  actor Pha as Pharmacien
  participant API as API Laravel

  Rec->>API: POST /admissions (walk-in)
  API-->>Rec: admission statut triage

  Inf->>API: PATCH /admissions/{id}/triage
  API-->>Inf: consultation_medicale

  Med->>API: PATCH /consultation + examens[]
  API-->>Med: prelevement

  Inf->>API: PATCH /prelevement
  API-->>Inf: examens_laboratoire

  Lab->>API: PUT resultats examens
  API-->>Lab: resultats termines

  Med->>API: PATCH /diagnostic + medicaments
  API-->>Med: diagnostic_prescription

  Pha->>API: PUT ordonnances/{id}/delivrer
  API-->>Pha: delivrance_medicaments

  Med->>API: PATCH /initiation
  API-->>Med: initiation_traitement
```

### Scénario B — Patient réserve un créneau RDV

```mermaid
sequenceDiagram
  autonumber
  actor Pat as Patient
  actor Rec as Receptionniste
  participant WEB as Frontend
  participant API as API Laravel
  participant CR as CreneauService

  Pat->>WEB: Choisit medecin + date
  WEB->>API: GET /patient/creneaux
  API->>CR: creneauxDisponibles()
  CR-->>API: horaires libres
  API-->>WEB: liste creneaux
  Pat->>WEB: Selectionne une heure
  WEB->>API: POST /patient/rendez-vous
  API->>CR: estDisponible ?
  API-->>Pat: RDV en_attente

  Rec->>API: POST /accueil/demandes/{id}/confirmer
  API->>CR: valider creneau
  API-->>Rec: RDV confirme

  Note over API,Pat: Rappels auto J-1 puis H-2
```

---

## 4. Diagrammes d'activités (2 scénarios)

### Scénario A — Parcours clinique Accueil → Traitement

```mermaid
flowchart TD
  Start([Debut]) --> Accueil[Accueil: enregistrer patient]
  Accueil --> Triage[Triage infirmier]
  Triage --> Consult[Consultation medicale]
  Consult --> Exam{Examens prescrits?}
  Exam -->|Oui| Prelev[Prelevement]
  Prelev --> Labo[Analyses laboratoire]
  Labo --> Diag[Diagnostic + ordonnance]
  Exam -->|Non| Diag
  Diag --> Pharma[Delivrance pharmacie]
  Pharma --> Init[Initiation traitement]
  Init --> Suivi[Suivi / sortie]
  Suivi --> Fin([Fin])
```

### Scénario B — Gestion d'un rendez-vous (création → jour J)

```mermaid
flowchart TD
  Start([Debut]) --> Choix[Patient choisit un creneau]
  Choix --> Dispo{Creneau libre?}
  Dispo -->|Non| Choix
  Dispo -->|Oui| Create[RDV cree en_attente]
  Create --> Conf[Reception confirme]
  Conf --> Rappels[Rappels J-1 et H-2]
  Rappels --> JourJ{Jour J: patient present?}
  JourJ -->|Oui| Conv[Convertir RDV en admission]
  Conv --> Parcours[Entrer dans parcours clinique]
  JourJ -->|Non| Absent[Marquer absent]
  Parcours --> Fin([Fin])
  Absent --> Fin
```

---

## Légende courte (mémoire)

| Diagramme | Rôle |
|-----------|------|
| **Classes** | Structure des données du parcours (Admission au centre) |
| **Cas d'utilisation** | Interactions acteurs ↔ système (UC1–UC10) |
| **Séquence A** | Collaboration temps réel walk-in → initiation |
| **Séquence B** | Collaboration prise et confirmation de RDV |
| **Activité A** | Enchaînement des étapes métier cliniques |
| **Activité B** | Enchaînement RDV jusqu'au jour J |
