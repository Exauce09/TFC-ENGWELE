<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\Diagnostic;
use App\Models\DossierMedical;
use App\Models\Medecin;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\SoinInfirmier;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DossierSeeder extends Seeder
{
    public function run(): void
    {
        $patient = Patient::where('numero_patient', 'PAT-00001')->first();
        $medecin = Medecin::first();
        $departement = Departement::where('code', 'MED_GEN')->first();

        if (!$patient || !$medecin || !$departement) {
            return;
        }

        $dossier1 = DossierMedical::updateOrCreate(
            ['patient_id' => $patient->id, 'date_consultation' => '2026-06-15'],
            [
                'medecin_id' => $medecin->id,
                'departement_id' => $departement->id,
                'motif' => 'Fievre et douleurs articulaires',
                'anamnese' => 'Symptomes depuis 3 jours, pas de vomissements.',
                'examen_clinique' => 'Temperature 38.5°C, gorge legerement enflammee.',
                'observations' => 'Repos recommande, hydratation abondante.',
            ]
        );

        Diagnostic::updateOrCreate(
            ['dossier_id' => $dossier1->id, 'libelle' => 'Grippe saisonniere'],
            [
                'medecin_id' => $medecin->id,
                'code_cim10' => 'J11',
                'description' => 'Infection virale des voies respiratoires superieures.',
                'date_diagnostic' => '2026-06-15',
            ]
        );

        Prescription::updateOrCreate(
            ['dossier_id' => $dossier1->id, 'date_prescription' => '2026-06-15'],
            [
                'medecin_id' => $medecin->id,
                'patient_id' => $patient->id,
                'date_expiration' => '2026-07-15',
                'medicaments' => [
                    ['nom' => 'Amoxicilline', 'dosage' => '500mg', 'frequence' => '3x/jour', 'duree' => '7 jours'],
                    ['nom' => 'Paracetamol', 'dosage' => '1000mg', 'frequence' => '2x/jour', 'duree' => '5 jours'],
                ],
                'instructions_generales' => 'Prendre apres les repas. Repos et hydratation.',
                'statut' => 'active',
            ]
        );

        $depGyn = Departement::where('code', 'GYN')->first();
        if ($depGyn) {
            $dossier2 = DossierMedical::updateOrCreate(
                ['patient_id' => $patient->id, 'date_consultation' => '2026-05-10'],
                [
                    'medecin_id' => $medecin->id,
                    'departement_id' => $depGyn->id,
                    'motif' => 'Consultation de routine',
                    'anamnese' => 'Pas d antecedents particuliers.',
                    'examen_clinique' => 'Examen normal.',
                    'observations' => 'Suivi dans 6 mois.',
                ]
            );

            Diagnostic::updateOrCreate(
                ['dossier_id' => $dossier2->id, 'libelle' => 'Etat de sante satisfaisant'],
                [
                    'medecin_id' => $medecin->id,
                    'date_diagnostic' => '2026-05-10',
                ]
            );
        }

        $infirmier = User::updateOrCreate(
            ['email' => 'infirmier@amen.cd'],
            [
                'name' => 'Infirmiere Demo',
                'phone' => '+243000000004',
                'password' => Hash::make('Password@123'),
                'role' => 'infirmier',
                'is_active' => true,
            ]
        );

        SoinInfirmier::updateOrCreate(
            ['patient_id' => $patient->id, 'date_soin' => '2026-06-15 09:00:00'],
            [
                'infirmier_id' => $infirmier->id,
                'dossier_id' => $dossier1->id,
                'temperature' => 38.5,
                'tension_arterielle' => '120/80',
                'frequence_cardiaque' => 78,
                'frequence_respiratoire' => 18,
                'saturation_02' => 97,
                'poids_kg' => 62.5,
                'observations' => 'Patient stable a l accueil.',
            ]
        );
    }
}
