<?php

namespace Database\Seeders;

use App\Models\Medecin;
use App\Models\Notification;
use App\Models\Patient;
use App\Models\RendezVous;
use App\Models\User;
use App\Services\JitsiService;
use Illuminate\Database\Seeder;

class IntegrationSeeder extends Seeder
{
    public function run(): void
    {
        $patient = Patient::whereHas('user', fn ($q) => $q->where('email', 'patient@amen.cd'))->first();
        $medecin = Medecin::whereHas('user', fn ($q) => $q->where('email', 'medecin@amen.cd'))->first();
        $patientUser = User::where('email', 'patient@amen.cd')->first();
        $medecinUser = User::where('email', 'medecin@amen.cd')->first();

        if (!$patient || !$medecin) {
            return;
        }

        $jitsi = app(JitsiService::class);

        $rdv = RendezVous::updateOrCreate(
            [
                'patient_id' => $patient->id,
                'medecin_id' => $medecin->id,
                'date_rdv' => now()->addDay()->toDateString(),
                'type' => 'teleconsultation',
            ],
            [
                'departement_id' => $medecin->departement_id,
                'heure_rdv' => '10:00',
                'motif' => 'Consultation de suivi en ligne',
                'statut' => 'confirme',
                'montant' => 15000,
                'paiement_statut' => 'paye',
                'paiement_mode' => 'airtel_money',
                'cree_par' => $patientUser?->id,
            ]
        );

        $rdv->update(['lien_video' => $jitsi->embedUrl($rdv->id)]);

        if ($patientUser) {
            Notification::updateOrCreate(
                ['user_id' => $patientUser->id, 'titre' => 'Teleconsultation confirmee'],
                [
                    'message' => "Votre consultation en ligne du {$rdv->date_rdv->format('d/m/Y')} a 10h00 est confirmee.",
                    'type' => 'rdv_confirme',
                    'lu' => false,
                    'data' => ['rendez_vous_id' => $rdv->id],
                ]
            );
            Notification::updateOrCreate(
                ['user_id' => $patientUser->id, 'titre' => 'Paiement enregistre'],
                [
                    'message' => 'Votre paiement Mobile Money pour la teleconsultation a ete confirme.',
                    'type' => 'paiement',
                    'lu' => false,
                    'data' => ['rendez_vous_id' => $rdv->id],
                ]
            );
        }

        if ($medecinUser) {
            Notification::updateOrCreate(
                ['user_id' => $medecinUser->id, 'titre' => 'Teleconsultation a venir'],
                [
                    'message' => "Consultation en ligne avec {$patientUser?->name} demain a 10h00.",
                    'type' => 'rdv_rappel',
                    'lu' => false,
                    'data' => ['rendez_vous_id' => $rdv->id],
                ]
            );
        }
    }
}
