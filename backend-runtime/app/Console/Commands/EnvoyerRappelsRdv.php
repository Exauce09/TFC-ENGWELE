<?php

namespace App\Console\Commands;

use App\Models\RendezVous;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

/**
 * Rappels automatiques :
 * - J-1  : la veille (fenêtre ~24 h avant) → rappel_24h_envoye
 * - H-2  : 2 heures avant → rappel_1h_envoye (colonne historique réutilisée)
 */
class EnvoyerRappelsRdv extends Command
{
    protected $signature = 'rdv:envoyer-rappels';

    protected $description = 'Envoie les rappels RDV J-1 et H-2 aux patients';

    public function handle(NotificationService $notifications): int
    {
        $j1 = $this->envoyerJ1($notifications);
        $h2 = $this->envoyerH2($notifications);

        $this->info("Rappels envoyés — J-1: {$j1}, H-2: {$h2}");

        return self::SUCCESS;
    }

    private function envoyerJ1(NotificationService $notifications): int
    {
        $demain = now()->addDay()->toDateString();
        $count = 0;

        RendezVous::with(['patient.user', 'medecin.user', 'departement'])
            ->whereDate('date_rdv', $demain)
            ->whereIn('statut', ['en_attente', 'confirme'])
            ->where('rappel_24h_envoye', false)
            ->chunkById(50, function ($rdvs) use ($notifications, &$count) {
                foreach ($rdvs as $rdv) {
                    $user = $rdv->patient?->user;
                    if (! $user) {
                        continue;
                    }
                    $heure = Carbon::parse($rdv->heure_rdv)->format('H:i');
                    $notifications->notify(
                        $user,
                        'Rappel rendez-vous (J-1)',
                        "Rappel : demain {$demain} à {$heure}"
                            .($rdv->medecin?->user?->name ? ' avec '.$rdv->medecin->user->name : '')
                            .'. Présentez-vous à l\'accueil.',
                        'rdv_rappel',
                        ['rendez_vous_id' => $rdv->id, 'rappel' => 'j1'],
                        sendSms: true,
                    );
                    $rdv->update(['rappel_24h_envoye' => true]);
                    $count++;
                }
            });

        return $count;
    }

    private function envoyerH2(NotificationService $notifications): int
    {
        $debut = now()->addHours(2)->subMinutes(15);
        $fin = now()->addHours(2)->addMinutes(15);
        $count = 0;

        RendezVous::with(['patient.user', 'medecin.user'])
            ->whereIn('statut', ['en_attente', 'confirme'])
            ->where('rappel_1h_envoye', false)
            ->whereDate('date_rdv', now()->toDateString())
            ->get()
            ->each(function (RendezVous $rdv) use ($notifications, $debut, $fin, &$count) {
                $debutRdv = Carbon::parse(
                    $rdv->date_rdv->toDateString().' '.Carbon::parse($rdv->heure_rdv)->format('H:i:s')
                );
                if ($debutRdv->lt($debut) || $debutRdv->gt($fin)) {
                    return;
                }
                $user = $rdv->patient?->user;
                if (! $user) {
                    return;
                }
                $heure = $debutRdv->format('H:i');
                $notifications->notify(
                    $user,
                    'Rappel rendez-vous (H-2)',
                    "Votre rendez-vous est dans environ 2 heures ({$heure}). Pensez à vous présenter à l'accueil.",
                    'rdv_rappel',
                    ['rendez_vous_id' => $rdv->id, 'rappel' => 'h2'],
                    sendSms: true,
                );
                $rdv->update(['rappel_1h_envoye' => true]);
                $count++;
            });

        return $count;
    }
}
