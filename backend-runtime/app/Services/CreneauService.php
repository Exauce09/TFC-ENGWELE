<?php

namespace App\Services;

use App\Models\Medecin;
use App\Models\RendezVous;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CreneauService
{
    public const DUREE_MINUTES = 30;

    /** Horaires par défaut si le médecin n'a pas renseigné ses disponibilités. */
    private const DEFAUT = [
        'lundi' => ['08:00-12:00', '14:00-17:00'],
        'mardi' => ['08:00-12:00', '14:00-17:00'],
        'mercredi' => ['08:00-12:00', '14:00-17:00'],
        'jeudi' => ['08:00-12:00', '14:00-17:00'],
        'vendredi' => ['08:00-12:00', '14:00-17:00'],
        'samedi' => ['08:00-12:00'],
        'dimanche' => [],
    ];

    private const JOURS = [
        1 => 'lundi',
        2 => 'mardi',
        3 => 'mercredi',
        4 => 'jeudi',
        5 => 'vendredi',
        6 => 'samedi',
        0 => 'dimanche',
        7 => 'dimanche',
    ];

    /** Statuts qui occupent un créneau. */
    public const STATUTS_OCCUPES = ['en_attente', 'confirme', 'en_cours'];

    public function creneauxDisponibles(int $medecinId, string $date, ?int $exclureRdvId = null): array
    {
        $jour = Carbon::parse($date)->startOfDay();
        if ($jour->lt(now()->startOfDay())) {
            return [];
        }

        $medecin = Medecin::findOrFail($medecinId);
        $plages = $this->plagesPourJour($medecin, $jour);
        $occupes = $this->heuresOccupees($medecinId, $date, $exclureRdvId);

        $slots = [];
        foreach ($plages as [$debut, $fin]) {
            $cursor = $debut->copy();
            while ($cursor->copy()->addMinutes(self::DUREE_MINUTES)->lte($fin)) {
                $heure = $cursor->format('H:i');
                $passe = $jour->isToday() && $cursor->lt(now());
                $libre = ! $passe && ! isset($occupes[$heure]);

                $slots[] = [
                    'heure' => $heure,
                    'disponible' => $libre,
                    'duree_minutes' => self::DUREE_MINUTES,
                ];
                $cursor->addMinutes(self::DUREE_MINUTES);
            }
        }

        return $slots;
    }

    public function estDisponible(int $medecinId, string $date, string $heure, ?int $exclureRdvId = null): bool
    {
        $heureNorm = Carbon::createFromFormat('H:i', substr($heure, 0, 5))->format('H:i');

        foreach ($this->creneauxDisponibles($medecinId, $date, $exclureRdvId) as $slot) {
            if ($slot['heure'] === $heureNorm && $slot['disponible']) {
                return true;
            }
        }

        return false;
    }

    /** @return Collection<int, array{0: Carbon, 1: Carbon}> */
    private function plagesPourJour(Medecin $medecin, Carbon $jour): Collection
    {
        $cle = self::JOURS[(int) $jour->dayOfWeek] ?? 'lundi';
        $dispo = $medecin->disponibilites;
        if (! is_array($dispo) || $dispo === []) {
            $dispo = self::DEFAUT;
        }

        $plagesBrutes = $dispo[$cle] ?? $dispo[ucfirst($cle)] ?? [];
        if (! is_array($plagesBrutes)) {
            $plagesBrutes = [];
        }

        return collect($plagesBrutes)->map(function ($plage) use ($jour) {
            if (! is_string($plage) || ! str_contains($plage, '-')) {
                return null;
            }
            [$a, $b] = array_map('trim', explode('-', $plage, 2));
            try {
                $debut = Carbon::parse($jour->toDateString().' '.$a);
                $fin = Carbon::parse($jour->toDateString().' '.$b);
            } catch (\Throwable) {
                return null;
            }

            return $debut->lt($fin) ? [$debut, $fin] : null;
        })->filter()->values();
    }

    /** @return array<string, true> */
    private function heuresOccupees(int $medecinId, string $date, ?int $exclureRdvId): array
    {
        $query = RendezVous::query()
            ->where('medecin_id', $medecinId)
            ->whereDate('date_rdv', $date)
            ->whereIn('statut', self::STATUTS_OCCUPES);

        if ($exclureRdvId) {
            $query->where('id', '!=', $exclureRdvId);
        }

        $map = [];
        foreach ($query->get(['heure_rdv']) as $rdv) {
            $h = Carbon::parse($rdv->heure_rdv)->format('H:i');
            $map[$h] = true;
        }

        return $map;
    }
}
