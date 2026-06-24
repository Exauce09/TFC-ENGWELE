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
        $items = Departement::orderBy('nom')->get(['id', 'nom', 'code']);

        return response()->json([
            'success' => true,
            'message' => 'Liste des departements',
            'data' => $items,
        ]);
    }

    public function medecins(): JsonResponse
    {
        $query = Medecin::with(['user:id,name', 'departement:id,nom']);

        if (request()->filled('departement_id')) {
            $query->where('departement_id', request('departement_id'));
        }

        $items = $query->get()->map(fn ($m) => [
            'id' => $m->id,
            'name' => $m->user?->name,
            'specialite' => $m->specialite,
            'departement_id' => $m->departement_id,
            'departement' => $m->departement?->nom,
            'tarif_consultation' => $m->tarif_consultation,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Liste des medecins',
            'data' => $items,
        ]);
    }
}
