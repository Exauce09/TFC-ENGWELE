<?php

namespace App\Services\Parcours;

use App\Enums\AdmissionStatut;
use App\Models\Admission;
use App\Models\AdmissionStatutHistorique;
use App\Models\User;
use InvalidArgumentException;

/**
 * Machine à états du parcours patient.
 * Empêche les sauts illégaux (ex. enregistre → hospitalisation).
 */
class AdmissionStateMachine
{
    public function canTransition(Admission $admission, AdmissionStatut|string $vers): bool
    {
        $from = AdmissionStatut::from($admission->statut);
        $to = $vers instanceof AdmissionStatut ? $vers : AdmissionStatut::from($vers);

        return $from->peutTransitionnerVers($to);
    }

    /**
     * @throws InvalidArgumentException
     */
    public function transition(
        Admission $admission,
        AdmissionStatut|string $vers,
        ?User $acteur = null,
        ?string $commentaire = null,
        array $meta = []
    ): Admission {
        $from = AdmissionStatut::from($admission->statut);
        $to = $vers instanceof AdmissionStatut ? $vers : AdmissionStatut::from($vers);

        if (!$from->peutTransitionnerVers($to)) {
            throw new InvalidArgumentException(
                "Transition interdite : {$from->value} → {$to->value}. "
                .'Autorisées : '.implode(', ', array_map(fn (AdmissionStatut $s) => $s->value, $from->transitionsAutorisees()))
            );
        }

        $admission->update(['statut' => $to->value]);

        AdmissionStatutHistorique::create([
            'admission_id' => $admission->id,
            'statut_avant' => $from->value,
            'statut_apres' => $to->value,
            'user_id' => $acteur?->id,
            'role_acteur' => $acteur?->role,
            'commentaire' => $commentaire,
            'meta' => $meta ?: null,
        ]);

        return $admission->fresh();
    }

    /** @return list<string> */
    public function prochainesEtapes(Admission $admission): array
    {
        return array_map(
            fn (AdmissionStatut $s) => $s->value,
            AdmissionStatut::from($admission->statut)->transitionsAutorisees()
        );
    }
}
