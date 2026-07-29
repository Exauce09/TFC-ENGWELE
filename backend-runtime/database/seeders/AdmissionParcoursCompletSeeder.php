<?php

namespace Database\Seeders;

use App\Enums\AdmissionStatut;
use App\Models\Admission;
use App\Models\Consultation;
use App\Models\Departement;
use App\Models\ExamenLabo;
use App\Models\Medecin;
use App\Models\ParcoursPrescription;
use App\Models\Patient;
use App\Models\StockMedicament;
use App\Models\Triage;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Démo bout-en-bout : admissions à différents stades labo → pharmacie → initiation.
 */
class AdmissionParcoursCompletSeeder extends Seeder
{
    public function run(): void
    {
        $patient = Patient::where('numero_patient', 'PAT-00001')->first()
            ?? Patient::query()->first();
        $medecin = Medecin::with('user')->first();
        $dept = Departement::where('code', 'MED_GEN')->first() ?? Departement::query()->first();
        $reception = User::where('email', 'receptionniste@amen.cd')->first();
        $infirmier = User::where('email', 'infirmier@amen.cd')->first();
        $laborantin = User::where('email', 'laborantin@amen.cd')->first();

        if (! $patient || ! $medecin || ! $dept || ! $reception) {
            return;
        }

        // Enrichir stock avec lot / péremption
        StockMedicament::query()->whereNull('numero_lot')->orWhere('numero_lot', '')->limit(5)->each(function (StockMedicament $m) {
            $m->update([
                'numero_lot' => 'LOT-'.strtoupper(substr(md5($m->nom), 0, 6)),
                'date_expiration' => now()->addYear()->toDateString(),
            ]);
        });

        // 1) Admission en file labo (examens prescrits, prélevés)
        $admLabo = Admission::updateOrCreate(
            ['numero_admission' => 'ADM-DEMO-LABO'],
            [
                'patient_id' => $patient->id,
                'departement_id' => $dept->id,
                'enregistre_par' => $reception->id,
                'medecin_referent_id' => $medecin->id,
                'statut' => AdmissionStatut::ExamensLaboratoire->value,
                'mode_arrivee' => 'marche',
                'type_visite' => 'consultation',
                'motif_arrivee' => 'Fièvre et fatigue — NFS + glycémie prescrits',
                'arrivee_at' => now()->subHours(3),
                'facturation_ouverte' => true,
            ]
        );

        Triage::updateOrCreate(
            ['admission_id' => $admLabo->id],
            [
                'infirmier_id' => $infirmier?->id ?? $reception->id,
                'tension_arterielle' => '128/82',
                'temperature' => 38.4,
                'frequence_cardiaque' => 96,
                'saturation_02' => 97,
                'poids_kg' => 68,
                'niveau_urgence' => 'urgent',
                'triage_at' => now()->subHours(2),
            ]
        );

        Consultation::updateOrCreate(
            ['admission_id' => $admLabo->id],
            [
                'medecin_id' => $medecin->id,
                'date_consultation' => now()->subHours(2),
                'motif' => 'Fièvre depuis 3 jours',
                'anamnese' => 'Asthénie, céphalées, pas de toux productive',
                'examen_clinique' => 'Abdomen souple, pas de foyer pulmonaire franc',
                'diagnostic_provisoire' => 'Syndrome fébrile à explorer',
                'type_diagnostic' => 'provisoire',
            ]
        );

        ExamenLabo::updateOrCreate(
            ['admission_id' => $admLabo->id, 'type_examen' => 'NFS'],
            [
                'prescrit_par' => $medecin->user_id,
                'categorie' => 'biologie',
                'indication' => 'Bilan infectieux',
                'priorite' => 'urgent',
                'urgent' => true,
                'type_echantillon' => 'sang veineux EDTA',
                'conditions_prelevement' => 'Sans jeûne',
                'numero_echantillon' => 'ECH-DEMO-NFS-001',
                'statut' => 'en_cours',
                'prescrit_at' => now()->subHour(),
                'preleve_at' => now()->subMinutes(40),
                'recu_labo_at' => now()->subMinutes(30),
            ]
        );

        ExamenLabo::updateOrCreate(
            ['admission_id' => $admLabo->id, 'type_examen' => 'Glycémie à jeun'],
            [
                'prescrit_par' => $medecin->user_id,
                'categorie' => 'biologie',
                'indication' => 'Dépistage diabète',
                'priorite' => 'routine',
                'type_echantillon' => 'sang veineux fluoré',
                'conditions_prelevement' => 'À jeun 8h',
                'numero_echantillon' => 'ECH-DEMO-GLY-001',
                'statut' => 'en_cours',
                'prescrit_at' => now()->subHour(),
                'preleve_at' => now()->subMinutes(40),
                'recu_labo_at' => now()->subMinutes(30),
            ]
        );

        // 2) Admission en attente pharmacie (diagnostic + Rx active)
        $admPharma = Admission::updateOrCreate(
            ['numero_admission' => 'ADM-DEMO-PHARMA'],
            [
                'patient_id' => $patient->id,
                'departement_id' => $dept->id,
                'enregistre_par' => $reception->id,
                'medecin_referent_id' => $medecin->id,
                'statut' => AdmissionStatut::DiagnosticPrescription->value,
                'mode_arrivee' => 'marche',
                'type_visite' => 'consultation',
                'motif_arrivee' => 'Paludisme suspecté — Rx à délivrer',
                'arrivee_at' => now()->subHours(5),
                'facturation_ouverte' => true,
            ]
        );

        ExamenLabo::updateOrCreate(
            ['admission_id' => $admPharma->id, 'type_examen' => 'GE / TDR Paludisme'],
            [
                'prescrit_par' => $medecin->user_id,
                'laborantin_id' => $laborantin?->id,
                'categorie' => 'biologie',
                'indication' => 'Fièvre tropicale',
                'priorite' => 'stat',
                'urgent' => true,
                'type_echantillon' => 'sang capillaire',
                'numero_echantillon' => 'ECH-DEMO-TDR-001',
                'statut' => 'termine',
                'technique' => 'TDR HRP2/pLDH',
                'resultats' => [
                    ['parametre' => 'Plasmodium falciparum', 'valeur' => 'Positif', 'unite' => '', 'norme' => 'Négatif', 'flag' => 'critique'],
                    ['parametre' => 'Autres espèces', 'valeur' => 'Négatif', 'unite' => '', 'norme' => 'Négatif', 'flag' => 'N'],
                ],
                'interpretation' => 'TDR positif P. falciparum — corréler cliniquement',
                'prescrit_at' => now()->subHours(4),
                'preleve_at' => now()->subHours(3),
                'recu_labo_at' => now()->subHours(3),
                'termine_at' => now()->subHours(2),
            ]
        );

        Consultation::updateOrCreate(
            ['admission_id' => $admPharma->id],
            [
                'medecin_id' => $medecin->id,
                'date_consultation' => now()->subHours(2),
                'motif' => 'Fièvre + frissons',
                'diagnostic_final' => 'Accès palustre simple à P. falciparum',
                'code_cim10' => 'B50.9',
                'type_diagnostic' => 'final',
                'decision' => 'Traitement ambulatoire ACT',
            ]
        );

        $stock = StockMedicament::where('nom', 'like', '%Paracétamol%')->first()
            ?? StockMedicament::query()->first();

        ParcoursPrescription::updateOrCreate(
            ['admission_id' => $admPharma->id, 'numero_ordonnance' => 'ORD-P-DEMO-001'],
            [
                'medecin_id' => $medecin->id,
                'date_prescription' => now()->toDateString(),
                'diagnostic_motif' => 'Accès palustre simple à P. falciparum',
                'medicaments' => [
                    [
                        'nom' => $stock?->nom ?? 'Artéméther-Luméfantrine',
                        'nom_dci' => $stock?->dci ?? 'Artéméther/Luméfantrine',
                        'dosage' => $stock?->dosage ?? '20/120 mg',
                        'forme' => $stock?->forme ?? 'comprimé',
                        'frequence' => 'selon schéma ACT',
                        'duree' => '3 jours',
                        'quantite' => 24,
                    ],
                    [
                        'nom' => 'Paracétamol',
                        'dosage' => '500 mg',
                        'forme' => 'comprimé',
                        'frequence' => '1 cp x 3/j si fièvre',
                        'duree' => '3 jours',
                        'quantite' => 12,
                    ],
                ],
                'statut' => 'active',
                'allergies_signalees' => $patient->allergies,
            ]
        );

        // 3) Admission prête pour initiation (déjà délivrée)
        $admInit = Admission::updateOrCreate(
            ['numero_admission' => 'ADM-DEMO-INIT'],
            [
                'patient_id' => $patient->id,
                'departement_id' => $dept->id,
                'enregistre_par' => $reception->id,
                'medecin_referent_id' => $medecin->id,
                'statut' => AdmissionStatut::DelivranceMedicaments->value,
                'mode_arrivee' => 'marche',
                'type_visite' => 'consultation',
                'motif_arrivee' => 'Médicaments délivrés — retour médecin',
                'arrivee_at' => now()->subDay(),
                'facturation_ouverte' => true,
            ]
        );

        ParcoursPrescription::updateOrCreate(
            ['admission_id' => $admInit->id, 'numero_ordonnance' => 'ORD-P-DEMO-002'],
            [
                'medecin_id' => $medecin->id,
                'pharmacien_id' => User::where('email', 'pharmacien@amen.cd')->value('id'),
                'date_prescription' => now()->subDay()->toDateString(),
                'medicaments' => [
                    ['nom' => 'Amoxicilline', 'dosage' => '500 mg', 'frequence' => '3x/j', 'duree' => '7 jours', 'quantite' => 21],
                ],
                'lignes_delivrance' => [
                    [
                        'medicament_nom' => 'Amoxicilline',
                        'quantite' => 21,
                        'numero_lot' => 'LOT-AMOX01',
                        'date_expiration' => now()->addMonths(18)->toDateString(),
                        'substitue' => false,
                    ],
                ],
                'statut' => 'delivree',
                'delivree_at' => now()->subHours(2),
                'notes_pharmacien' => 'Conseillé de prendre pendant les repas',
            ]
        );
    }
}
