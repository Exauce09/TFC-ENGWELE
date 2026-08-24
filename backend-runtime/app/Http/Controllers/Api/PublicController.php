<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Departement;
use App\Models\Medecin;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    public function departements(): JsonResponse
    {
        $items = Departement::query()
            ->where('is_active', true)
            ->orderBy('nom')
            ->get(['id', 'nom', 'code']);

        return response()->json([
            'success' => true,
            'message' => 'Liste des departements',
            'data' => $items,
        ]);
    }

    public function medecins(): JsonResponse
    {
        $query = Medecin::query()
            ->with([
                'user:id,name,departement_id,is_active,deleted_at',
                'user.departement:id,nom',
                'departement:id,nom',
            ])
            ->whereHas('user', fn ($u) => $u->where('is_active', true));

        $departementId = null;
        if (request()->filled('departement_id')) {
            $raw = request('departement_id');
            // Accepte l'id numérique ou un code (ex. MED_GEN) — évite liste vide si le front envoie le code.
            if (is_numeric($raw)) {
                $departementId = (int) $raw;
            } else {
                $departementId = Departement::query()
                    ->where('code', $raw)
                    ->value('id');
                $departementId = $departementId ? (int) $departementId : null;
            }
        }

        if ($departementId) {
            // Aligner sur users.departement_id OU medecins.departement_id
            // (les deux peuvent diverger si le profil métier n'a pas été resynchronisé).
            $query->where(function ($q) use ($departementId) {
                $q->where('departement_id', $departementId)
                    ->orWhereHas('user', fn ($u) => $u->where('departement_id', $departementId));
            });
        }

        // ->all() : tableau PHP listé (évite un objet JSON si les clés de Collection ne sont pas 0..n-1).
        $items = $query->get()
            ->unique(fn (Medecin $m) => $m->id)
            ->values()
            ->map(function (Medecin $m) {
                $effectiveDeptId = $m->user?->departement_id ?: $m->departement_id;
                $effectiveDeptNom = $m->user?->departement?->nom
                    ?? $m->departement?->nom;

                return [
                    'id' => (int) $m->id,
                    'name' => $m->user?->name,
                    'nom' => $m->user?->name,
                    'specialite' => $m->specialite,
                    'departement_id' => $effectiveDeptId ? (int) $effectiveDeptId : null,
                    'departement' => $effectiveDeptNom,
                    'tarif_consultation' => $m->tarif_consultation,
                    'user' => [
                        'id' => $m->user?->id,
                        'name' => $m->user?->name,
                        'departement_id' => $m->user?->departement_id ? (int) $m->user->departement_id : null,
                    ],
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'success' => true,
            'message' => 'Liste des medecins',
            'data' => $items,
        ]);
    }
}
