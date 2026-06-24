<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medecin;
use App\Models\RendezVous;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedecinController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->first();
        $today = $medecin
            ? RendezVous::where('medecin_id', $medecin->id)->whereDate('date_rdv', now()->toDateString())->count()
            : 0;
        $enAttente = $medecin
            ? RendezVous::where('medecin_id', $medecin->id)->where('statut', 'en_attente')->count()
            : 0;

        return response()->json([
            'success' => true,
            'message' => 'Dashboard medecin',
            'data' => [
                'rdv_du_jour' => $today,
                'rdv_en_attente' => $enAttente,
            ],
        ]);
    }

    public function planning(Request $request): JsonResponse
    {
        $medecin = Medecin::where('user_id', $request->user()->id)->firstOrFail();

        $query = RendezVous::with(['patient.user', 'departement'])
            ->where('medecin_id', $medecin->id);

        if ($request->filled('date')) {
            $query->whereDate('date_rdv', $request->date);
        } else {
            $query->whereDate('date_rdv', '>=', now()->toDateString());
        }

        $rdv = $query->orderBy('date_rdv')->orderBy('heure_rdv')->paginate(15);

        return response()->json([
            'success' => true,
            'message' => 'Planning medecin',
            'data' => $rdv->items(),
            'meta' => [
                'total' => $rdv->total(),
                'per_page' => $rdv->perPage(),
                'current_page' => $rdv->currentPage(),
            ],
        ]);
    }
}
