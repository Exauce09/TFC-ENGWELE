<?php

namespace Database\Seeders;

use App\Models\Departement;
use App\Models\DemandeRdv;
use App\Models\OperationChirurgicale;
use App\Models\Patient;
use App\Models\ResultatEchographie;
use App\Models\SeanceKinesitherapie;
use App\Models\SoinDentaire;
use App\Models\SuiviMaternite;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SpecialitesSeeder extends Seeder
{
    public function run(): void
    {
        $matDept = Departement::where('code', 'MAT')->first();
        $patient = Patient::where('numero_patient', 'PAT-00001')->first();

        $users = [
            ['email' => 'receptionniste@amen.cd', 'name' => 'Receptionniste Demo', 'role' => 'receptionniste'],
            ['email' => 'sage-femme@amen.cd', 'name' => 'Sage-femme Demo', 'role' => 'sage_femme', 'dept' => 'MAT'],
            ['email' => 'chirurgien@amen.cd', 'name' => 'Chirurgien Demo', 'role' => 'chirurgien', 'dept' => 'CHIR'],
            ['email' => 'echographiste@amen.cd', 'name' => 'Echographiste Demo', 'role' => 'echographiste', 'dept' => 'ECH'],
            ['email' => 'kinesitherapeute@amen.cd', 'name' => 'Kinesitherapeute Demo', 'role' => 'kinesitherapeute', 'dept' => 'KIN'],
            ['email' => 'dentiste@amen.cd', 'name' => 'Dentiste Demo', 'role' => 'dentiste', 'dept' => 'DENT'],
        ];

        $created = [];
        foreach ($users as $u) {
            $dept = isset($u['dept']) ? Departement::where('code', $u['dept'])->first() : null;
            $created[$u['role']] = User::updateOrCreate(
                ['email' => $u['email']],
                [
                    'name' => $u['name'],
                    'phone' => '+2430000000'.rand(10, 99),
                    'password' => Hash::make('Password@123'),
                    'role' => $u['role'],
                    'departement_id' => $dept?->id,
                    'is_active' => true,
                ]
            );
        }

        if ($matDept) {
            DemandeRdv::updateOrCreate(
                ['nom' => 'Marie Kasongo', 'telephone' => '+243990000001'],
                [
                    'departement_id' => $matDept->id,
                    'service_libelle' => 'Consultation prenatale',
                    'date_souhaitee' => now()->addDays(3)->toDateString(),
                    'message' => 'Premiere consultation grossesse',
                    'statut' => 'nouvelle',
                ]
            );
        }

        if (!$patient) {
            return;
        }

        if ($created['sage_femme'] ?? null) {
            SuiviMaternite::updateOrCreate(
                ['patient_id' => $patient->id, 'sage_femme_id' => $created['sage_femme']->id, 'type_visite' => 'consultation_prenatale'],
                ['grossesse_semaines' => 24, 'poids_kg' => 62, 'tension_arterielle' => '118/76', 'observations' => 'Evolution normale.']
            );
        }

        if ($created['chirurgien'] ?? null) {
            OperationChirurgicale::updateOrCreate(
                ['patient_id' => $patient->id, 'type_operation' => 'Appendicectomie'],
                [
                    'chirurgien_id' => $created['chirurgien']->id,
                    'date_operation' => now()->addDays(5)->toDateString(),
                    'salle' => 'Bloc 2',
                    'statut' => 'planifiee',
                ]
            );
        }

        if ($created['echographiste'] ?? null) {
            ResultatEchographie::updateOrCreate(
                ['patient_id' => $patient->id, 'date_examen' => '2026-06-20'],
                [
                    'echographiste_id' => $created['echographiste']->id,
                    'type_echo' => 'Abdominale',
                    'organe_examine' => 'Foie, rate',
                    'compte_rendu' => 'Organes sans anomalie significative.',
                    'conclusion' => 'Normal',
                    'statut' => 'termine',
                ]
            );
        }

        if ($created['kinesitherapeute'] ?? null) {
            SeanceKinesitherapie::updateOrCreate(
                ['patient_id' => $patient->id, 'date_seance' => now()->toDateString()],
                [
                    'kinesitherapeute_id' => $created['kinesitherapeute']->id,
                    'numero_seance' => 3,
                    'total_seances' => 10,
                    'techniques' => 'Mobilisation passive, renforcement',
                    'statut' => 'realisee',
                    'evolution' => 'amelioration',
                ]
            );
        }

        if ($created['dentiste'] ?? null) {
            SoinDentaire::updateOrCreate(
                ['patient_id' => $patient->id, 'date_soin' => '2026-06-18'],
                [
                    'dentiste_id' => $created['dentiste']->id,
                    'type_soin' => 'Detartrage',
                    'dents_traitees' => 'Arcade superieure',
                    'observations' => 'Hygiene a renforcer.',
                ]
            );
        }
    }
}
